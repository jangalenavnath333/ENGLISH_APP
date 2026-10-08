export interface VocabItem {
  word: string;
  meaning: string; // Marathi
  example: string;
}

export interface GrammarLesson {
  title: string;
  rule: string; // Marathi explanation
  examples: { en: string; mr: string }[];
}

export interface VerbForm {
  v1: string;
  v2: string;
  v3: string;
  meaning: string;
}

export interface PlanDay {
  day: number;
  label: string;
  theme: string;
  goal: string; // Marathi
  vocab: VocabItem[];
  grammar: GrammarLesson[];
  verbs: VerbForm[];
  speakingTopics: string[]; // ids from TOPICS in lib/gemini.ts
  sentences: string[]; // Marathi sentences the student must say in English
  writingPrompt: string;
  writingPromptMr: string;
}

export const PLAN: PlanDay[] = [
  {
    day: 1,
    label: "गुरुवार",
    theme: "Survival basics",
    goal: "स्वतःची ओळख, रोजचे शब्द आणि सोपी वाक्यं बोलायला शिका",
    vocab: [
      { word: "Hello", meaning: "नमस्कार", example: "Hello, how are you?" },
      { word: "Thank you", meaning: "धन्यवाद", example: "Thank you for your help." },
      { word: "Please", meaning: "कृपया", example: "Please sit here." },
      { word: "Sorry", meaning: "माफ करा", example: "Sorry, I am late." },
      { word: "Yes / No", meaning: "हो / नाही", example: "Yes, I understand. No, I don't know." },
      { word: "Water", meaning: "पाणी", example: "I want a glass of water." },
      { word: "Food", meaning: "जेवण", example: "The food is very tasty." },
      { word: "Name", meaning: "नाव", example: "My name is Rahul." },
      { word: "Friend", meaning: "मित्र", example: "She is my best friend." },
      { word: "Home", meaning: "घर", example: "I am at home now." },
      { word: "Work", meaning: "काम", example: "I go to work by bus." },
      { word: "Today", meaning: "आज", example: "Today is a good day." },
      { word: "Tomorrow", meaning: "उद्या", example: "I will call you tomorrow." },
      { word: "Help", meaning: "मदत", example: "Can you help me, please?" },
      { word: "Understand", meaning: "समजणे", example: "I don't understand this word." },
    ],
    grammar: [
      {
        title: "To be: am / is / are",
        rule: "'होणे' साठी: I → am, You/We/They → are, He/She/It → is. वाक्य असं: Subject + am/is/are + बाकी.",
        examples: [
          { en: "I am a student.", mr: "मी विद्यार्थी आहे." },
          { en: "She is my sister.", mr: "ती माझी बहीण आहे." },
          { en: "They are at home.", mr: "ते घरी आहेत." },
        ],
      },
      {
        title: "Present Simple (रोजच्या सवयी)",
        rule: "रोज किंवा नेहमी घडणाऱ्या गोष्टींसाठी verb चं पहिलं रूप (V1) वापरा. He/She/It बरोबर verb ला s/es लावा. नकार: don't / doesn't + V1.",
        examples: [
          { en: "I drink tea every morning.", mr: "मी रोज सकाळी चहा पितो." },
          { en: "He works in a bank.", mr: "तो बँकेत काम करतो." },
          { en: "She doesn't eat meat.", mr: "ती मांस खात नाही." },
        ],
      },
    ],
    verbs: [
      { v1: "go", v2: "went", v3: "gone", meaning: "जाणे" },
      { v1: "eat", v2: "ate", v3: "eaten", meaning: "खाणे" },
      { v1: "drink", v2: "drank", v3: "drunk", meaning: "पिणे" },
      { v1: "come", v2: "came", v3: "come", meaning: "येणे" },
      { v1: "see", v2: "saw", v3: "seen", meaning: "पाहणे" },
      { v1: "do", v2: "did", v3: "done", meaning: "करणे" },
      { v1: "have", v2: "had", v3: "had", meaning: "असणे / जवळ असणे" },
      { v1: "make", v2: "made", v3: "made", meaning: "बनवणे" },
    ],
    speakingTopics: ["intro", "cafe"],
    sentences: ["माझं नाव राहुल आहे.","मी पुण्यात राहतो.","मला चहा आवडतो.","तुझं नाव काय आहे?","कृपया मला मदत करा."],
    writingPrompt: "Write 5 sentences about yourself: your name, city, work or study, and what you like.",
    writingPromptMr: "स्वतःबद्दल ५ वाक्यं लिहा: नाव, शहर, काम/शिक्षण आणि तुम्हाला काय आवडतं.",
  },
  {
    day: 2,
    label: "शुक्रवार",
    theme: "Daily life & the past",
    goal: "काल काय केलं ते सांगा आणि प्रश्न विचारायला शिका",
    vocab: [
      { word: "Breakfast", meaning: "सकाळचा नाश्ता", example: "I eat breakfast at eight." },
      { word: "Lunch", meaning: "दुपारचं जेवण", example: "We had lunch together." },
      { word: "Dinner", meaning: "रात्रीचं जेवण", example: "What is for dinner?" },
      { word: "Family", meaning: "कुटुंब", example: "My family lives in Pune." },
      { word: "Mother / Father", meaning: "आई / वडील", example: "My mother cooks very well." },
      { word: "Brother / Sister", meaning: "भाऊ / बहीण", example: "I have one brother." },
      { word: "Morning", meaning: "सकाळ", example: "I wake up early in the morning." },
      { word: "Night", meaning: "रात्र", example: "I sleep at ten at night." },
      { word: "Time", meaning: "वेळ", example: "What time is it?" },
      { word: "Money", meaning: "पैसे", example: "I don't have enough money." },
      { word: "Market", meaning: "बाजार", example: "I went to the market yesterday." },
      { word: "School", meaning: "शाळा", example: "The school is near my house." },
      { word: "Price", meaning: "किंमत", example: "What is the price of this bag?" },
      { word: "Cheap / Expensive", meaning: "स्वस्त / महाग", example: "This phone is too expensive." },
      { word: "Buy", meaning: "विकत घेणे", example: "I want to buy a shirt." },
    ],
    grammar: [
      {
        title: "Past Simple (भूतकाळ)",
        rule: "आधी घडून गेलेल्या गोष्टींसाठी verb चं दुसरं रूप (V2) वापरा. नियमित verb ला -ed लावा (work → worked). नकार: didn't + V1. प्रश्न: Did + subject + V1?",
        examples: [
          { en: "I went to the market yesterday.", mr: "मी काल बाजारात गेलो." },
          { en: "She didn't call me.", mr: "तिने मला फोन केला नाही." },
          { en: "Did you eat lunch?", mr: "तू जेवण केलंस का?" },
        ],
      },
      {
        title: "Questions: What / Where / When / Why / How",
        rule: "प्रश्नाचा शब्द आधी, मग do/does/did, मग subject, मग V1. उदा. Where + do + you + live?",
        examples: [
          { en: "What do you do?", mr: "तू काय करतोस?" },
          { en: "Where did you go?", mr: "तू कुठे गेलास?" },
          { en: "Why are you late?", mr: "तुला उशीर का झाला?" },
        ],
      },
    ],
    verbs: [
      { v1: "take", v2: "took", v3: "taken", meaning: "घेणे" },
      { v1: "give", v2: "gave", v3: "given", meaning: "देणे" },
      { v1: "know", v2: "knew", v3: "known", meaning: "माहीत असणे" },
      { v1: "think", v2: "thought", v3: "thought", meaning: "विचार करणे" },
      { v1: "buy", v2: "bought", v3: "bought", meaning: "विकत घेणे" },
      { v1: "get", v2: "got", v3: "got", meaning: "मिळवणे" },
      { v1: "say", v2: "said", v3: "said", meaning: "म्हणणे" },
      { v1: "tell", v2: "told", v3: "told", meaning: "सांगणे" },
    ],
    speakingTopics: ["daily", "shop"],
    sentences: ["मी काल बाजारात गेलो.","तू जेवण केलंस का?","मी सकाळी सात वाजता उठलो.","तिने मला फोन केला नाही.","तू कुठे राहतोस?"],
    writingPrompt: "Write 5 sentences about what you did yesterday. Use past tense (went, ate, saw...).",
    writingPromptMr: "काल तुम्ही काय केलं त्याबद्दल ५ वाक्यं लिहा. भूतकाळ वापरा (went, ate, saw...).",
  },
  {
    day: 3,
    label: "शनिवार",
    theme: "Future & real situations",
    goal: "प्रवास, ऑफिस आणि भविष्यातले प्लॅन्स इंग्रजीत सांगा",
    vocab: [
      { word: "Ticket", meaning: "तिकीट", example: "I need two tickets, please." },
      { word: "Train / Bus", meaning: "रेल्वे / बस", example: "The train is late today." },
      { word: "Road", meaning: "रस्ता", example: "This road is very busy." },
      { word: "Hotel", meaning: "हॉटेल", example: "We booked a hotel room." },
      { word: "Office", meaning: "ऑफिस", example: "I reach the office at nine." },
      { word: "Meeting", meaning: "मीटिंग", example: "I have a meeting at three." },
      { word: "Ready", meaning: "तयार", example: "Are you ready to go?" },
      { word: "Busy", meaning: "व्यस्त", example: "Sorry, I am busy right now." },
      { word: "Late / Early", meaning: "उशीर / लवकर", example: "Don't be late tomorrow." },
      { word: "Near / Far", meaning: "जवळ / दूर", example: "The station is near here." },
      { word: "Left / Right", meaning: "डावीकडे / उजवीकडे", example: "Turn left at the corner." },
      { word: "Where", meaning: "कुठे", example: "Where is the bus stop?" },
      { word: "Plan", meaning: "योजना", example: "What is your plan for Sunday?" },
      { word: "Wait", meaning: "थांबणे", example: "Please wait for five minutes." },
      { word: "Need", meaning: "गरज असणे", example: "I need your help." },
    ],
    grammar: [
      {
        title: "Future: will / going to",
        rule: "will + V1: आत्ता ठरवलेलं किंवा वचन. am/is/are going to + V1: आधीच ठरवलेला प्लॅन.",
        examples: [
          { en: "I will help you.", mr: "मी तुला मदत करेन." },
          { en: "I am going to visit Pune on Sunday.", mr: "मी रविवारी पुण्याला जाणार आहे." },
          { en: "It will rain tomorrow.", mr: "उद्या पाऊस पडेल." },
        ],
      },
      {
        title: "can / should / must",
        rule: "can = शकतो (क्षमता), should = पाहिजे (सल्ला), must = च पाहिजे (सक्ती). तिन्ही नंतर V1 येतं, s लागत नाही.",
        examples: [
          { en: "I can speak a little English.", mr: "मला थोडं इंग्रजी बोलता येतं." },
          { en: "You should drink more water.", mr: "तू जास्त पाणी प्यायला पाहिजे." },
          { en: "We must leave now.", mr: "आपण आत्ता निघालंच पाहिजे." },
        ],
      },
    ],
    verbs: [
      { v1: "write", v2: "wrote", v3: "written", meaning: "लिहिणे" },
      { v1: "read", v2: "read", v3: "read", meaning: "वाचणे" },
      { v1: "speak", v2: "spoke", v3: "spoken", meaning: "बोलणे" },
      { v1: "meet", v2: "met", v3: "met", meaning: "भेटणे" },
      { v1: "leave", v2: "left", v3: "left", meaning: "निघणे / सोडणे" },
      { v1: "bring", v2: "brought", v3: "brought", meaning: "आणणे" },
      { v1: "keep", v2: "kept", v3: "kept", meaning: "ठेवणे" },
      { v1: "begin", v2: "began", v3: "begun", meaning: "सुरू करणे" },
    ],
    speakingTopics: ["travel", "free"],
    sentences: ["मी उद्या ऑफिसला जाणार आहे.","मला एक तिकीट पाहिजे.","बस स्टॉप कुठे आहे?","मला थोडं इंग्रजी बोलता येतं.","आपण आत्ता निघायला पाहिजे."],
    writingPrompt: "Write 5 sentences about your plans for next week. Use will and going to.",
    writingPromptMr: "पुढच्या आठवड्यातल्या तुमच्या प्लॅन्सबद्दल ५ वाक्यं लिहा. will आणि going to वापरा.",
  },
  {
    day: 4,
    label: "रविवार",
    theme: "Fluency day",
    goal: "भावना, मतं सांगा आणि वाक्यं जोडून लांब बोला",
    vocab: [
      { word: "Happy", meaning: "आनंदी", example: "I am happy to see you." },
      { word: "Tired", meaning: "थकलेला", example: "I am very tired today." },
      { word: "Angry", meaning: "रागावलेला", example: "Please don't be angry." },
      { word: "Hungry", meaning: "भूक लागलेला", example: "I am hungry. Let's eat." },
      { word: "Important", meaning: "महत्त्वाचं", example: "English is important for my job." },
      { word: "Difficult / Easy", meaning: "कठीण / सोपं", example: "This lesson is easy." },
      { word: "Because", meaning: "कारण / म्हणून", example: "I am late because of traffic." },
      { word: "But", meaning: "पण", example: "I like tea, but I don't like coffee." },
      { word: "So", meaning: "म्हणून", example: "It was raining, so I stayed home." },
      { word: "Maybe", meaning: "कदाचित", example: "Maybe I will come tomorrow." },
      { word: "Always", meaning: "नेहमी", example: "She always smiles." },
      { word: "Sometimes", meaning: "कधीकधी", example: "Sometimes I walk to work." },
      { word: "Never", meaning: "कधीच नाही", example: "I never drink soda." },
      { word: "Together", meaning: "एकत्र", example: "Let's study together." },
      { word: "I think", meaning: "मला वाटतं", example: "I think this is a good idea." },
    ],
    grammar: [
      {
        title: "Present Continuous & Present Perfect",
        rule: "am/is/are + V-ing = आत्ता चालू असलेलं. have/has + V3 = आत्तापर्यंत झालेलं किंवा अनुभव.",
        examples: [
          { en: "I am learning English now.", mr: "मी आत्ता इंग्रजी शिकत आहे." },
          { en: "She has finished her work.", mr: "तिने तिचं काम संपवलं आहे." },
          { en: "I have never been to Japan.", mr: "मी कधीच जपानला गेलो नाही." },
        ],
      },
      {
        title: "Connectors: and, but, so, because, if",
        rule: "छोटी वाक्यं जोडून लांब बोला. and = आणि, but = पण, so = म्हणून, because = कारण, if = जर.",
        examples: [
          { en: "I was tired, so I slept early.", mr: "मी थकलो होतो, म्हणून लवकर झोपलो." },
          { en: "I want to go, but I have no time.", mr: "मला जायचं आहे, पण वेळ नाही." },
          { en: "If it rains, I will stay home.", mr: "पाऊस पडला तर मी घरी राहीन." },
        ],
      },
    ],
    verbs: [
      { v1: "run", v2: "ran", v3: "run", meaning: "पळणे" },
      { v1: "sit", v2: "sat", v3: "sat", meaning: "बसणे" },
      { v1: "stand", v2: "stood", v3: "stood", meaning: "उभं राहणे" },
      { v1: "understand", v2: "understood", v3: "understood", meaning: "समजणे" },
      { v1: "forget", v2: "forgot", v3: "forgotten", meaning: "विसरणे" },
      { v1: "find", v2: "found", v3: "found", meaning: "शोधणे / सापडणे" },
      { v1: "feel", v2: "felt", v3: "felt", meaning: "वाटणे" },
      { v1: "pay", v2: "paid", v3: "paid", meaning: "पैसे देणे" },
    ],
    speakingTopics: ["free", "intro"],
    sentences: ["मी थकलो होतो, म्हणून लवकर झोपलो.","मला जायचं आहे, पण वेळ नाही.","मी आत्ता इंग्रजी शिकत आहे.","पाऊस पडला तर मी घरी राहीन.","मला वाटतं हा चांगला विचार आहे."],
    writingPrompt:
      "Write a short paragraph (6-8 sentences) about your week: what you learned, what was difficult, and your plan to keep learning. Use because, but and so.",
    writingPromptMr:
      "तुमच्या आठवड्याबद्दल ६-८ वाक्यांचा परिच्छेद लिहा: काय शिकलात, काय कठीण वाटलं, आणि पुढे कसं शिकणार. because, but आणि so वापरा.",
  },
];
