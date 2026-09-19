import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. Fallback mode will be active.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'Tada' });
  });

  // 1. Analyze Screen (Vision)
  app.post('/api/gemini/analyze-screen', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        // Fallback response if API key is not configured
        return res.json({
          oneButtonToPress: {
            label: 'Continue or Proceed',
            color: 'Blue or Green',
            position: 'Bottom center of your screen',
          },
          whatHappensNext: 'This will take you to the next confirmation step. Read before confirming.',
          isDangerous: false,
          warning: null,
          spokenAdvice: 'Press the large button at the bottom of your screen to proceed. Never share any OTP or PIN.',
        });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const prompt = `You are "Tada", an AI companion designed for Indian senior citizens. 
The user is stuck on this mobile or computer screen and needs guidance.
Analyze the provided screenshot with utmost care:
1. Identify the ONE exact button the user should press to move forward safely. Specify:
   - exact words written on the button
   - visible color of the button
   - position on the screen (e.g., "Bottom right corner", "Center in green pill", "Top left corner")
2. Explain in plain, simple, jargon-free words: what will happen right after they press it.
3. CRITICAL SAFETY CHECK: Does this screen ask for an OTP, UPI PIN, ATM PIN, bank password, CVV, or remote access apps (AnyDesk, TeamViewer, RustDesk)?
   - If YES: set isDangerous to true, and provide a strong, clear, protective warning. Bank and electricity boards NEVER ask for OTP or PIN to receive money!
4. Provide a spokenAdvice string: a calm, soothing 1-2 sentence instruction meant to be read aloud to an Indian senior (grandparent). Use a respectful, warm Indian elder tone (e.g. respectful, patient).

Respond ONLY with valid JSON matching the schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              oneButtonToPress: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  color: { type: Type.STRING },
                  position: { type: Type.STRING },
                },
                required: ['label', 'color', 'position'],
              },
              whatHappensNext: { type: Type.STRING },
              isDangerous: { type: Type.BOOLEAN },
              warning: { type: Type.STRING },
              spokenAdvice: { type: Type.STRING },
            },
            required: ['oneButtonToPress', 'whatHappensNext', 'isDangerous', 'spokenAdvice'],
          },
        },
      });

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (err: any) {
      console.error('Screen analysis error:', err);
      res.status(500).json({
        error: 'Screen analysis failed',
        details: err?.message || 'Unknown error',
        fallback: {
          oneButtonToPress: {
            label: 'Look for Confirm or Next',
            color: 'Highlighted color',
            position: 'Bottom of the screen',
          },
          whatHappensNext: 'This proceeds to the next step. If in doubt, ask your family.',
          isDangerous: false,
          warning: 'Remember: Never enter your UPI PIN to receive money.',
          spokenAdvice: 'I am here with you. Look for the main button at the bottom, and remember never to share any secret PIN.',
        },
      });
    }
  });

  // 2. Check Fraud / Scam
  app.post('/api/gemini/check-fraud', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text message is required' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        // Safe heuristic fallback
        const lower = text.toLowerCase();
        const isSuspicious =
          lower.includes('electricity') ||
          lower.includes('disconnect') ||
          lower.includes('lottery') ||
          lower.includes('blocked') ||
          lower.includes('pan card') ||
          lower.includes('apk') ||
          lower.includes('upi pin') ||
          lower.includes('send 1') ||
          lower.includes('job offer') ||
          lower.includes('dear customer');

        return res.json({
          verdict: isSuspicious ? 'LIKELY FRAUD' : 'SAFE',
          why: isSuspicious
            ? 'Scammers use urgent threats like electricity disconnection, bank KYC block, or lottery prizes to induce panic. Genuine authorities never demand payment through personal numbers.'
            : 'This appears to be a standard notification, but always remember never to share OTP or PIN with anyone.',
          oneInstruction: isSuspicious
            ? 'Delete this message immediately. Do not click any link or call the number in the SMS.'
            : 'Verify sender details before clicking any unknown link.',
          helpline: '1930',
          spokenAdvice: isSuspicious
            ? 'Be very careful. This looks like a fraud message. Please delete it and do not click any link. You can call 1930 if anyone threatens you.'
            : 'This message appears safe, but remember never to share your secret PIN or password with anyone.',
        });
      }

      const prompt = `You are "Tada", an AI fraud protection specialist for Indian senior citizens.
Analyze this SMS, WhatsApp message, payment request, or call summary:
"${text}"

Provide a structured, senior-friendly fraud assessment:
1. verdict: Exactly one of:
   - "SAFE" (Legitimate, typical personal message or verifiable official notification)
   - "BE CAREFUL" (Contains suspicious links, unsolicited offers, or unverified requests)
   - "LIKELY FRAUD" (Classic Indian scams: electricity power disconnection threat, SBI/HDFC/PNB KYC block, lottery/KBC prize, APK install request, Part-time job YouTube like scam, Fedex courier customs drugs arrest, enter PIN to receive money).
2. why: Explain in plain, comforting, zero-jargon language why this is or isn't a scam. For example, explain how scammers use fear of power cutoff at 9:30 PM to trick people.
3. oneInstruction: ONE single, unambiguous, actionable command (e.g., "Do not click the link. Delete this message right now." or "Ask your bank manager in person at the local branch.").
4. helpline: Always "1930" (National Cyber Crime Reporting Portal Helpline).
5. spokenAdvice: A reassuring 2-sentence voice script spoken in a warm, patient Indian voice for the grandparent.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: {
                type: Type.STRING,
                enum: ['SAFE', 'BE CAREFUL', 'LIKELY FRAUD'],
              },
              why: { type: Type.STRING },
              oneInstruction: { type: Type.STRING },
              helpline: { type: Type.STRING },
              spokenAdvice: { type: Type.STRING },
            },
            required: ['verdict', 'why', 'oneInstruction', 'helpline', 'spokenAdvice'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Fraud check error:', err);
      res.status(500).json({
        error: 'Fraud check failed',
        details: err?.message,
        verdict: 'BE CAREFUL',
        why: 'Unable to verify this message right now. When in doubt, never click any link or send money.',
        oneInstruction: 'Do not pay or reply. Wait and check with your family or call 1930.',
        helpline: '1930',
        spokenAdvice: 'We could not reach the checker, so please be cautious. Never share any OTP or PIN with anyone.',
      });
    }
  });

  // 3. Practice Room: Spot-The-Fraud Scenarios
  app.get('/api/gemini/practice-fraud-game', async (req, res) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        // Pre-crafted high quality scenario
        const fallbackScenarios = [
          {
            id: 'elec-scam',
            title: 'Electricity Bill Urgent Notice',
            sender: 'VM-DISCOM (Unknown Mobile +91 98765 43210)',
            message: 'Dear Consumer, Your electricity will be disconnected tonight at 9:30 PM due to unpaid bill of ₹480. Immediately call Officer Sharma at 9876543210 to update bill or pay on link: http://bit.ly/quick-power-pay',
            question: 'What is the safe and correct thing to do?',
            options: [
              {
                id: 'opt1',
                text: 'Ignore the message and check the official discom website or bill book tomorrow.',
                isCorrect: true,
                feedback: 'Spot on! Electricity boards never disconnect at night and never use private WhatsApp or bit.ly links.',
              },
              {
                id: 'opt2',
                text: 'Click the link immediately and pay ₹480 so the fan and lights stay on.',
                isCorrect: false,
                feedback: 'Careful! That link installs a fake app or steals your card details. Electricity department gives written notice weeks in advance.',
              },
            ],
            lesson: 'Electricity bills are never collected via private mobile numbers or short bit.ly links. Always pay through your usual electricity counter or standard app.',
          },
          {
            id: 'upi-receive-pin',
            title: 'Buyer on OLX Wants to Pay You',
            sender: 'Buyer: Ramesh Kumar',
            message: 'Sir, I am buying your sofa. I am sending you ₹5,000 on PhonePe. Please open the notification and enter your 6-digit UPI PIN to claim ₹5,000 in your account.',
            question: 'What should you do?',
            options: [
              {
                id: 'opt1',
                text: 'Do not enter any PIN. You NEVER need a PIN to receive money.',
                isCorrect: true,
                feedback: 'Excellent! Entering your PIN ALWAYS deducts money from your account, never deposits.',
              },
              {
                id: 'opt2',
                text: 'Enter the PIN quickly so the money comes into your bank balance.',
                isCorrect: false,
                feedback: 'Warning! PIN is ONLY for giving money away. To receive money, you do not need to do anything.',
              },
            ],
            lesson: 'Golden Rule of UPI: PIN is for DEBIT only. If anyone says "Enter PIN to receive money", they are 100% trying to steal your money.',
          },
          {
            id: 'kyc-pan-scam',
            title: 'Bank Account Blocked Notice',
            sender: 'SMS from unknown +91 81234 56789',
            message: 'Dear Customer, Your SBI Bank account has been suspended today because PAN Card is not linked. Click here http://sbi-kyc-update.apk to install Bank Assistant and keep account active.',
            question: 'What should you do?',
            options: [
              {
                id: 'opt1',
                text: 'Do not download the APK. Visit your local branch with your passbook if you have doubts.',
                isCorrect: true,
                feedback: 'Spot on! Banks never send APK files. An APK file is a dangerous software that reads all your OTPs.',
              },
              {
                id: 'opt2',
                text: 'Download the APK file and install it so your pension does not stop.',
                isCorrect: false,
                feedback: 'Danger! Never install any app sent over SMS or WhatsApp. It gives hackers full control of your phone.',
              },
            ],
            lesson: 'Banks NEVER ask you to download .apk files. If your bank needs KYC, visit your friendly branch manager in person.',
          },
        ];
        const scenario = fallbackScenarios[Math.floor(Math.random() * fallbackScenarios.length)];
        return res.json(scenario);
      }

      const prompt = `Generate an interactive "Spot The Fraud" educational scenario specifically tailored for an Indian senior citizen (aged 60-85).
Focus on common real-world scams in India:
- Electricity disconnection at 9:30 PM scam
- UPI "enter PIN to receive refund/payment" scam
- KYC suspension / PAN link .apk download scam
- Courier parcel with "illegal items" digital arrest scam
- Lucky draw / lottery voucher scam

Return a JSON object with:
- id: unique string
- title: clear title
- sender: realistic sender info
- message: the exact text or call script they received
- question: a clear question asking what to do
- options: array of exactly 2 options: one safe (isCorrect: true) and one dangerous (isCorrect: false), each with text and constructive feedback
- lesson: one warm, memorable rule of thumb`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              sender: { type: Type.STRING },
              message: { type: Type.STRING },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN },
                    feedback: { type: Type.STRING },
                  },
                  required: ['id', 'text', 'isCorrect', 'feedback'],
                },
              },
              lesson: { type: Type.STRING },
            },
            required: ['id', 'title', 'sender', 'message', 'question', 'options', 'lesson'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Practice scenario generation error:', err);
      res.json({
        id: 'gold-rule',
        title: 'UPI Payment Rehearsal',
        sender: 'Unknown Caller',
        message: 'Sir, I am sending you ₹2,000 refund. Please enter your 4-digit UPI PIN to receive it.',
        question: 'Should you enter your PIN to receive money?',
        options: [
          {
            id: 'opt1',
            text: 'NO! You NEVER enter a PIN to receive money.',
            isCorrect: true,
            feedback: 'Spot on! A PIN is only used to send money out of your account.',
          },
          {
            id: 'opt2',
            text: 'YES, enter the PIN to deposit the refund.',
            isCorrect: false,
            feedback: 'Remember: entering a PIN always gives money away. To receive money, no PIN is needed.',
          },
        ],
        lesson: 'No PIN is ever needed to receive money on UPI.',
      });
    }
  });

  // 4. Voice Agent with Agentic Function Calling (Ask me anything)
  app.post('/api/gemini/voice-agent', async (req, res) => {
    try {
      const { userMessage, history = [] } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback intelligent intent parser
        const lower = (userMessage || '').toLowerCase();
        let toolCall: { name: string; args: any } | null = null;
        let reply = "Namaste! I am right here with you. What would you like to do today?";

        if (lower.includes('stuck') || lower.includes('screen') || lower.includes('camera') || lower.includes('look at')) {
          toolCall = { name: 'openScreenCoach', args: {} };
          reply = "Let me look at your screen with you. Opening the Screen Helper now.";
        } else if (lower.includes('scam') || lower.includes('otp') || lower.includes('fraud') || lower.includes('safe to pay') || lower.includes('message')) {
          toolCall = { name: 'checkScam', args: { text: userMessage } };
          reply = "Let us check that message right now to keep you completely safe. Opening the Safety Checker.";
        } else if (lower.includes('practice') || lower.includes('wallet') || lower.includes('rehearse') || lower.includes('fake money')) {
          toolCall = { name: 'startPractice', args: {} };
          reply = "Let us go to the Practice Room. You have 10,000 practice rupees where nothing real can go wrong.";
        } else if (lower.includes('doctor') || lower.includes('hospital') || lower.includes('chemist') || lower.includes('medicine') || lower.includes('pharmacy')) {
          toolCall = { name: 'findNearby', args: { type: lower.includes('hospital') ? 'hospital' : 'chemist' } };
          reply = "I will help you find the closest help right away. Opening your Out & About helper.";
        } else if (lower.includes('home') || lower.includes('lost') || lower.includes('out') || lower.includes('directions')) {
          toolCall = { name: 'findNearby', args: { type: 'hospital' } };
          reply = "Do not worry at all. I can show you the route home or contact your family immediately.";
        } else if (lower.includes('music') || lower.includes('song') || lower.includes('rafi') || lower.includes('bhajan') || lower.includes('80s') || lower.includes('90s')) {
          const era = lower.includes('rafi') ? 'rafi' : lower.includes('bhajan') ? 'bhajans' : lower.includes('90') ? '1990s' : '1980s';
          toolCall = { name: 'playEra', args: { era } };
          reply = `Playing your favorite peaceful ${era} music for you now.`;
        } else if (lower.includes('family') || lower.includes('whatsapp') || lower.includes('daughter') || lower.includes('son')) {
          toolCall = { name: 'messageFamily', args: {} };
          reply = "I am opening WhatsApp to connect you with your loved ones.";
        } else if (lower.includes('train') || lower.includes('flight') || lower.includes('travel') || lower.includes('senior citizen concession') || lower.includes('berth')) {
          toolCall = { name: 'planTravel', args: { destination: 'destination', mode: 'train' } };
          reply = "Indian Railways offers lower berth senior quota and station wheelchair assistance. Opening travel details.";
        }

        return res.json({
          reply,
          toolCalls: toolCall ? [toolCall] : [],
        });
      }

      // Define agentic tools for function calling
      const tools: any[] = [
        {
          functionDeclarations: [
            {
              name: 'openScreenCoach',
              description: 'Opens the camera screen coach when user says they are stuck on an app or screen, do not know which button to click, or need someone to look at their phone screen.',
              parameters: {
                type: Type.OBJECT,
                properties: {},
              },
            },
            {
              name: 'checkScam',
              description: 'Opens the payment safety checker when someone receives a suspicious SMS, WhatsApp message, lottery claim, asks about OTP, or asks if a payment is safe.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: 'The text or message the user wants to check' },
                },
              },
            },
            {
              name: 'startPractice',
              description: 'Navigates user to the UPI practice room with a fake ₹10,000 wallet to rehearse payments safely.',
              parameters: {
                type: Type.OBJECT,
                properties: {},
              },
            },
            {
              name: 'findNearby',
              description: 'Helps find nearby chemist (medical shop) or hospital, or guides the user when they are outside.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    enum: ['chemist', 'hospital'],
                    description: 'Whether they need medicine/chemist or hospital/doctor',
                  },
                },
                required: ['type'],
              },
            },
            {
              name: 'planTravel',
              description: 'Provides Indian senior citizen travel advice, concessions, lower berth railway quotas, or airport wheelchair assistance.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  destination: { type: Type.STRING, description: 'The destination or city' },
                  mode: { type: Type.STRING, enum: ['train', 'bus', 'flight'], description: 'Mode of transport' },
                },
                required: ['mode'],
              },
            },
            {
              name: 'playEra',
              description: 'Plays Indian nostalgic music era such as 1980s, 1990s, Mohd Rafi, or morning Bhajans.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  era: { type: Type.STRING, enum: ['1980s', '1990s', 'rafi', 'bhajans'], description: 'The music collection' },
                },
                required: ['era'],
              },
            },
            {
              name: 'messageFamily',
              description: 'Opens WhatsApp message helper to notify the user family or send emergency location.',
              parameters: {
                type: Type.OBJECT,
                properties: {},
              },
            },
            {
              name: 'logWin',
              description: 'Logs a self-reliance achievement in the user Confidence Ledger and celebrates.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  reason: { type: Type.STRING, description: 'What the user accomplished on their own' },
                },
                required: ['reason'],
              },
            },
          ],
        },
      ];

      const systemInstruction = `You are "Tada", a devoted, patient, and warm AI companion for Indian senior citizens (Uncle & Aunty).
Tagline: "You can do it yourself. I'll stand next to you."
Tone: Warm, respectful Indian English, deeply reassuring, speaks slowly and simply. Never condescending.
Always be protective of their financial safety.
AGENTIC CONTROL:
Whenever the user's intent matches any tool, you MUST call the appropriate function tool so the app navigates automatically for them!
For example:
- "Someone is asking me for an OTP" -> call checkScam with details, reassure them.
- "I do not know what to press on this screen" -> call openScreenCoach.
- "Can I practice sending money?" -> call startPractice.
- "I need a doctor or medicine" -> call findNearby.
- "Play some Kishore Kumar or Rafi songs" -> call playEra.
- "I want to send WhatsApp to my son" -> call messageFamily.
Keep your spoken reply short, loving, and clear (1 to 2 sentences).`;

      const contents = [
        ...history.map((h: any) => ({
          role: h.role,
          parts: [{ text: h.content }],
        })),
        { role: 'user', parts: [{ text: userMessage }] },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          tools,
        },
      });

      const toolCalls = response.functionCalls || [];
      const reply = response.text || 'I am right here with you, Ji. What can I do for you?';

      res.json({
        reply,
        toolCalls: toolCalls.map((tc) => ({
          name: tc.name,
          args: tc.args,
        })),
      });
    } catch (err: any) {
      console.error('Voice agent error:', err);
      res.status(500).json({
        error: 'Voice agent failed',
        details: err?.message,
        reply: "I am here with you, Ji. You can tap any of the six buttons on your screen anytime.",
        toolCalls: [],
      });
    }
  });

  // 5. Senior Travel Advice
  app.post('/api/gemini/travel-advice', async (req, res) => {
    try {
      const { query = 'Senior citizen train travel advice' } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          summary: 'Indian senior citizen travel facilities & concessions',
          tips: [
            'Railways Lower Berth Quota: When booking IRCTC tickets, select Senior Citizen Quota for automatic lower berth allocation.',
            'Station Wheelchair & Battery Buggy: Free wheelchair assistance is available at major railway stations via 139 or Sahayak booth.',
            'Airlines Senior Concession: Air India and IndiGo provide up to 50% discount on basic fare for citizens aged 60+ (carry Aadhaar Card).',
            'State Bus Free/Discount Travel: Most State Road Transport Corporations (KSRTC, MSRTC, UPSRTC, etc.) offer 50% to 100% fare discounts for seniors.',
          ],
          emergencyHelpline: 'Railway Helpline: 139 | Emergency: 112',
        });
      }

      const prompt = `Provide practical, up-to-date travel advice for Indian senior citizens regarding: "${query}".
Focus on:
- Indian Railways senior citizen lower berth quota & booking tips
- Wheelchair & battery car assistance at stations and airports
- Airline senior citizen concessions
- Bus travel passes
- Essential comfort & safety tips (packing medication, carrying physical Aadhaar copy, emergency numbers).
Provide a concise, friendly response.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              emergencyHelpline: { type: Type.STRING },
            },
            required: ['summary', 'tips', 'emergencyHelpline'],
          },
        },
      });

      res.json(JSON.parse(response.text?.trim() || '{}'));
    } catch (err: any) {
      console.error('Travel advice error:', err);
      res.json({
        summary: 'Indian Railways & Senior Travel Facilities',
        tips: [
          'Request lower berths under senior citizen quota during booking.',
          'Call 139 for porter or wheelchair assistance at railway stations.',
          'Carry a physical copy of Aadhaar Card for age verification.',
        ],
        emergencyHelpline: 'Railway Helpline: 139',
      });
    }
  });

  // 6. Memory prompt for grandchild
  app.get('/api/gemini/grandchild-prompt', async (req, res) => {
    try {
      const prompts = [
        {
          topic: 'First Bicycle or Radio',
          prompt: 'Tell your grandchild about your very first bicycle or transistor radio. Who bought it for you, and how the whole neighborhood came to see it?',
          questionToAsk: 'Did you know in our time, our whole colony shared one radio to listen to Ameen Sayani on Binaca Geetmala?',
        },
        {
          topic: 'Handwritten Letters & Postman',
          prompt: 'Share the excitement of the postman ringing his bicycle bell with a blue inland letter (Antardeshiye Patra) from your parents.',
          questionToAsk: 'Before WhatsApp, we waited 7 days for one letter. Do you want to see how we folded the blue paper letter?',
        },
        {
          topic: 'Monsoon Chai & Rainy Days',
          prompt: 'Tell your grandchild how schools used to declare a rainy-day holiday, and your mother made hot onion pakodas and cardamom chai on the kerosene stove.',
          questionToAsk: 'What do you love eating most when it rains outside?',
        },
        {
          topic: 'Gold Spot & 50 Paise Sweets',
          prompt: 'Remind them of the taste of Gold Spot, Campa Cola, or buying roasted chana for 25 paise after school.',
          questionToAsk: 'Guess what my favorite cold drink was when I was your age?',
        },
        {
          topic: 'Train Journey Window Seat',
          prompt: 'Describe taking a long train journey with a steel water camper, puris wrapped in newspapers, and hearing "Chai Garam" at midnight stations.',
          questionToAsk: 'Have you ever eaten warm puri-aloo wrapped in paper on a train window seat?',
        },
      ];
      const selected = prompts[Math.floor(Math.random() * prompts.length)];
      res.json(selected);
    } catch (err: any) {
      res.json({
        topic: 'Childhood Games',
        prompt: 'Share what games you used to play outdoors before screens existed: Gilli Danda, Pitthu, or Hopscotch.',
        questionToAsk: 'Do you want to know what games Dadu/Nani played without any batteries or phone?',
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tada server running on http://localhost:${PORT}`);
  });
}

startServer();
