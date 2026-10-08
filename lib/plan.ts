export interface VocabItem {
  word: string;
  meaning: string; // Marathi
  pron: string; // Marathi-script pronunciation
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

const v = (word: string, meaning: string, pron: string, example: string): VocabItem => ({ word, meaning, pron, example });
const vb = (v1: string, v2: string, v3: string, meaning: string): VerbForm => ({ v1, v2, v3, meaning });

export const PLAN: PlanDay[] = [
  {
    day: 1,
    label: "सुरुवात",
    theme: "Absolute basics",
    goal: "शून्यापासून सुरुवात: अभिवादन, मी/तू/तो, 'आहे' आणि 'पाहिजे/आवडतं' सांगायला शिका",
    vocab: [
      v("Hello", "नमस्कार", "हॅलो", "Hello, my name is Rahul."),
      v("Good morning", "शुभ सकाळ", "गुड मॉर्निंग", "Good morning, sir."),
      v("Good night", "शुभ रात्री", "गुड नाईट", "Good night, mother."),
      v("Thank you", "धन्यवाद", "थॅंक यू", "Thank you very much."),
      v("Please", "कृपया", "प्लीज", "Please give me water."),
      v("Sorry", "माफ करा", "सॉरी", "Sorry, I am late."),
      v("Yes", "हो", "यस", "Yes, I know."),
      v("No", "नाही", "नो", "No, thank you."),
      v("I", "मी", "आय", "I am Rahul."),
      v("You", "तू / तुम्ही", "यू", "You are my friend."),
      v("He / She", "तो / ती", "ही / शी", "She is my sister."),
      v("We", "आम्ही / आपण", "वी", "We are friends."),
      v("This", "हे / हा", "दिस", "This is my phone."),
      v("That", "ते / तो", "दॅट", "That is a bus."),
      v("Name", "नाव", "नेम", "What is your name?"),
      v("Water", "पाणी", "वॉटर", "I want water."),
      v("Food", "जेवण", "फूड", "The food is good."),
      v("Mother", "आई", "मदर", "My mother is at home."),
      v("Father", "वडील", "फादर", "My father works."),
      v("Friend", "मित्र", "फ्रेंड", "He is my friend."),
      v("One to ten", "एक ते दहा", "वन टू थ्री फोर फाइव्ह सिक्स सेव्हन एट नाईन टेन", "I have two books."),
    ],
    grammar: [
      {
        title: "I am / You are / He-She is",
        rule: "'आहे' साठी: I → am, You/We/They → are, He/She/It → is. वाक्य: Subject + am/is/are + बाकी.",
        examples: [
          { en: "I am Rahul.", mr: "मी राहुल आहे." },
          { en: "You are my friend.", mr: "तू माझा मित्र आहेस." },
          { en: "She is my mother.", mr: "ती माझी आई आहे." },
        ],
      },
      {
        title: "This is / That is, I want / I like",
        rule: "This is = हे आहे (जवळचं), That is = ते आहे (लांबचं). I want = मला पाहिजे. I like = मला आवडतं.",
        examples: [
          { en: "This is my phone.", mr: "हा माझा फोन आहे." },
          { en: "I want water.", mr: "मला पाणी पाहिजे." },
          { en: "I like tea.", mr: "मला चहा आवडतो." },
        ],
      },
    ],
    verbs: [
      vb("go", "went", "gone", "जाणे"),
      vb("come", "came", "come", "येणे"),
      vb("eat", "ate", "eaten", "खाणे"),
      vb("drink", "drank", "drunk", "पिणे"),
      vb("sleep", "slept", "slept", "झोपणे"),
      vb("want", "wanted", "wanted", "पाहिजे असणे"),
      vb("like", "liked", "liked", "आवडणे"),
      vb("see", "saw", "seen", "पाहणे"),
    ],
    speakingTopics: ["intro"],
    sentences: [
      "माझं नाव राहुल आहे.",
      "तू माझा मित्र आहेस.",
      "हे पाणी आहे.",
      "मला पाणी पाहिजे.",
      "मला चहा आवडतो.",
      "मी घरी आहे.",
    ],
    writingPrompt: "Write 3 to 5 very simple sentences about yourself: My name is... I am... I like...",
    writingPromptMr: "स्वतःबद्दल ३-५ अगदी सोपी वाक्यं लिहा: My name is... I am... I like...",
  },
  {
    day: 2,
    label: "रोजचं जीवन",
    theme: "Daily life",
    goal: "रोजच्या सवयी सांगा आणि सोपे प्रश्न विचारा",
    vocab: [
      v("Home", "घर", "होम", "I am at home."),
      v("Work", "काम", "वर्क", "I work in an office."),
      v("Today", "आज", "टुडे", "Today is Monday."),
      v("Tomorrow", "उद्या", "टुमॉरो", "See you tomorrow."),
      v("Help", "मदत", "हेल्प", "Please help me."),
      v("Understand", "समजणे", "अंडरस्टँड", "I understand."),
      v("Morning", "सकाळ", "मॉर्निंग", "I walk in the morning."),
      v("Night", "रात्र", "नाईट", "I sleep at night."),
      v("Time", "वेळ", "टाईम", "What time is it?"),
      v("Money", "पैसे", "मनी", "I need money."),
      v("Market", "बाजार", "मार्केट", "The market is far."),
      v("School", "शाळा", "स्कूल", "The school is near."),
      v("Breakfast", "नाश्ता", "ब्रेकफास्ट", "I eat breakfast at eight."),
      v("Lunch", "दुपारचं जेवण", "लंच", "We eat lunch together."),
      v("Dinner", "रात्रीचं जेवण", "डिनर", "Dinner is ready."),
    ],
    grammar: [
      {
        title: "Present Simple (रोजच्या सवयी)",
        rule: "रोज घडणाऱ्या गोष्टींसाठी verb चं पहिलं रूप (V1) वापरा. He/She/It बरोबर verb ला s/es लावा. नकार: don't / doesn't + V1.",
        examples: [
          { en: "I drink tea every morning.", mr: "मी रोज सकाळी चहा पितो." },
          { en: "He works in a bank.", mr: "तो बँकेत काम करतो." },
          { en: "She doesn't eat meat.", mr: "ती मांस खात नाही." },
        ],
      },
      {
        title: "Questions: What / Where / Do you...?",
        rule: "प्रश्नाचा शब्द आधी, मग do/does, मग subject, मग V1. Yes/No प्रश्न: Do + you + V1?",
        examples: [
          { en: "What do you want?", mr: "तुला काय पाहिजे?" },
          { en: "Where do you live?", mr: "तू कुठे राहतोस?" },
          { en: "Do you like tea?", mr: "तुला चहा आवडतो का?" },
        ],
      },
    ],
    verbs: [
      vb("do", "did", "done", "करणे"),
      vb("have", "had", "had", "असणे / जवळ असणे"),
      vb("make", "made", "made", "बनवणे"),
      vb("take", "took", "taken", "घेणे"),
      vb("give", "gave", "given", "देणे"),
      vb("know", "knew", "known", "माहीत असणे"),
      vb("think", "thought", "thought", "विचार करणे"),
      vb("get", "got", "got", "मिळवणे"),
    ],
    speakingTopics: ["daily", "intro"],
    sentences: [
      "मी बँकेत काम करतो.",
      "तू कुठे राहतोस?",
      "मी रोज सकाळी चहा पितो.",
      "तुला काय पाहिजे?",
      "मला इंग्रजी समजत नाही.",
      "तुम्हाला मदत पाहिजे का?",
    ],
    writingPrompt: "Write 5 sentences about your daily routine from morning to night. Use I wake up, I eat, I go...",
    writingPromptMr: "सकाळपासून रात्रीपर्यंतच्या तुमच्या दिनचर्येबद्दल ५ वाक्यं लिहा. I wake up, I eat, I go... वापरा.",
  },
  {
    day: 3,
    label: "भूतकाळ",
    theme: "The past",
    goal: "काल काय केलं ते सांगा, खरेदी करा आणि भूतकाळाचे प्रश्न विचारा",
    vocab: [
      v("Yesterday", "काल", "येस्टरडे", "I went to the market yesterday."),
      v("Family", "कुटुंब", "फॅमिली", "My family lives in Pune."),
      v("Brother / Sister", "भाऊ / बहीण", "ब्रदर / सिस्टर", "I have one brother."),
      v("Phone", "फोन", "फोन", "My phone is new."),
      v("Shop", "दुकान", "शॉप", "The shop is closed."),
      v("Price", "किंमत", "प्राईस", "What is the price?"),
      v("Cheap / Expensive", "स्वस्त / महाग", "चीप / एक्स्पेन्सिव्ह", "This bag is expensive."),
      v("Buy", "विकत घेणे", "बाय", "I want to buy a shirt."),
      v("Bag", "पिशवी", "बॅग", "My bag is heavy."),
      v("Book", "पुस्तक", "बुक", "I read a book."),
      v("Shirt", "शर्ट", "शर्ट", "This shirt is nice."),
      v("Doctor", "डॉक्टर", "डॉक्टर", "I saw a doctor."),
      v("Hospital", "दवाखाना", "हॉस्पिटल", "The hospital is near."),
      v("Bus", "बस", "बस", "I came by bus."),
      v("Tea / Coffee", "चहा / कॉफी", "टी / कॉफी", "I drink tea."),
    ],
    grammar: [
      {
        title: "Past Simple (भूतकाळ)",
        rule: "आधी घडून गेलेल्या गोष्टींसाठी verb चं दुसरं रूप (V2) वापरा. नियमित verb ला -ed लावा (work → worked). नकार: didn't + V1.",
        examples: [
          { en: "I went to the market yesterday.", mr: "मी काल बाजारात गेलो." },
          { en: "She didn't call me.", mr: "तिने मला फोन केला नाही." },
          { en: "I bought a shirt.", mr: "मी एक शर्ट विकत घेतला." },
        ],
      },
      {
        title: "Past questions: Did you...?",
        rule: "भूतकाळाचा प्रश्न: Did + subject + V1? उत्तर: Yes, I did. / No, I didn't. 'Did' नंतर verb नेहमी V1.",
        examples: [
          { en: "Did you eat lunch?", mr: "तू जेवण केलंस का?" },
          { en: "Yes, I did.", mr: "हो, केलं." },
          { en: "Where did you go?", mr: "तू कुठे गेलास?" },
        ],
      },
    ],
    verbs: [
      vb("buy", "bought", "bought", "विकत घेणे"),
      vb("say", "said", "said", "म्हणणे"),
      vb("tell", "told", "told", "सांगणे"),
      vb("write", "wrote", "written", "लिहिणे"),
      vb("read", "read", "read", "वाचणे"),
      vb("speak", "spoke", "spoken", "बोलणे"),
      vb("meet", "met", "met", "भेटणे"),
      vb("leave", "left", "left", "निघणे / सोडणे"),
    ],
    speakingTopics: ["shop", "daily"],
    sentences: [
      "मी काल बाजारात गेलो.",
      "तू जेवण केलंस का?",
      "मी एक शर्ट विकत घेतला.",
      "तिने मला फोन केला नाही.",
      "ह्याची किंमत किती आहे?",
      "तू काल कुठे गेला होतास?",
    ],
    writingPrompt: "Write 5 sentences about what you did yesterday. Use the past tense (went, ate, saw, bought).",
    writingPromptMr: "काल तुम्ही काय केलं त्याबद्दल ५ वाक्यं लिहा. भूतकाळ वापरा (went, ate, saw, bought).",
  },
  {
    day: 4,
    label: "भविष्य",
    theme: "The future & travel",
    goal: "प्रवास, ऑफिस आणि पुढच्या प्लॅन्सबद्दल बोला",
    vocab: [
      v("Ticket", "तिकीट", "टिकेट", "I need two tickets, please."),
      v("Train", "रेल्वे", "ट्रेन", "The train is late today."),
      v("Hotel", "हॉटेल", "हॉटेल", "We booked a hotel room."),
      v("Office", "ऑफिस", "ऑफिस", "I reach the office at nine."),
      v("Meeting", "मीटिंग", "मीटिंग", "I have a meeting at three."),
      v("Ready", "तयार", "रेडी", "Are you ready to go?"),
      v("Busy", "व्यस्त", "बिझी", "Sorry, I am busy right now."),
      v("Late / Early", "उशीर / लवकर", "लेट / अर्ली", "Don't be late tomorrow."),
      v("Near / Far", "जवळ / दूर", "नियर / फार", "The station is near here."),
      v("Left / Right", "डावीकडे / उजवीकडे", "लेफ्ट / राईट", "Turn left at the corner."),
      v("Where", "कुठे", "व्हेअर", "Where is the bus stop?"),
      v("Plan", "योजना", "प्लॅन", "What is your plan for Sunday?"),
      v("Wait", "थांबणे", "वेट", "Please wait for five minutes."),
      v("Need", "गरज असणे", "नीड", "I need your help."),
      v("Road", "रस्ता", "रोड", "This road is very busy."),
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
      vb("bring", "brought", "brought", "आणणे"),
      vb("keep", "kept", "kept", "ठेवणे"),
      vb("begin", "began", "begun", "सुरू करणे"),
      vb("run", "ran", "run", "पळणे"),
      vb("sit", "sat", "sat", "बसणे"),
      vb("stand", "stood", "stood", "उभं राहणे"),
      vb("understand", "understood", "understood", "समजणे"),
      vb("forget", "forgot", "forgotten", "विसरणे"),
    ],
    speakingTopics: ["travel", "free"],
    sentences: [
      "मी उद्या ऑफिसला जाणार आहे.",
      "मला एक तिकीट पाहिजे.",
      "बस स्टॉप कुठे आहे?",
      "मला थोडं इंग्रजी बोलता येतं.",
      "आपण आत्ता निघालं पाहिजे.",
      "मी तुला मदत करेन.",
    ],
    writingPrompt: "Write 5 sentences about your plans for next week. Use will and going to.",
    writingPromptMr: "पुढच्या आठवड्यातल्या तुमच्या प्लॅन्सबद्दल ५ वाक्यं लिहा. will आणि going to वापरा.",
  },
  {
    day: 5,
    label: "भावना व मतं",
    theme: "Feelings & connecting sentences",
    goal: "भावना, मतं सांगा आणि वाक्यं जोडून लांब बोला",
    vocab: [
      v("Happy", "आनंदी", "हॅपी", "I am happy to see you."),
      v("Tired", "थकलेला", "टायर्ड", "I am very tired today."),
      v("Angry", "रागावलेला", "अँग्री", "Please don't be angry."),
      v("Hungry", "भूक लागलेला", "हंग्री", "I am hungry. Let's eat."),
      v("Important", "महत्त्वाचं", "इम्पॉर्टंट", "English is important for my job."),
      v("Difficult / Easy", "कठीण / सोपं", "डिफिकल्ट / ईझी", "This lesson is easy."),
      v("Because", "कारण / म्हणून", "बिकॉज", "I am late because of traffic."),
      v("But", "पण", "बट", "I like tea, but I don't like coffee."),
      v("So", "म्हणून", "सो", "It was raining, so I stayed home."),
      v("Maybe", "कदाचित", "मेबी", "Maybe I will come tomorrow."),
      v("Always", "नेहमी", "ऑलवेज", "She always smiles."),
      v("Sometimes", "कधीकधी", "सम्टाईम्स", "Sometimes I walk to work."),
      v("Never", "कधीच नाही", "नेव्हर", "I never drink soda."),
      v("Together", "एकत्र", "टुगेदर", "Let's study together."),
      v("I think", "मला वाटतं", "आय थिंक", "I think this is a good idea."),
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
      vb("find", "found", "found", "शोधणे / सापडणे"),
      vb("feel", "felt", "felt", "वाटणे"),
      vb("pay", "paid", "paid", "पैसे देणे"),
      vb("call", "called", "called", "फोन करणे"),
      vb("open", "opened", "opened", "उघडणे"),
      vb("close", "closed", "closed", "बंद करणे"),
      vb("learn", "learned", "learned", "शिकणे"),
      vb("wait", "waited", "waited", "थांबणे"),
    ],
    speakingTopics: ["free", "intro"],
    sentences: [
      "मी थकलो होतो, म्हणून लवकर झोपलो.",
      "मला जायचं आहे, पण वेळ नाही.",
      "मी आत्ता इंग्रजी शिकत आहे.",
      "पाऊस पडला तर मी घरी राहीन.",
      "मला वाटतं हा चांगला विचार आहे.",
      "मला भूक लागली आहे, म्हणून मी जेवत आहे.",
    ],
    writingPrompt:
      "Write a short paragraph (6-8 sentences) about your week: what you learned, what was difficult, and your plan to keep learning. Use because, but and so.",
    writingPromptMr:
      "तुमच्या आठवड्याबद्दल ६-८ वाक्यांचा परिच्छेद लिहा: काय शिकलात, काय कठीण वाटलं, आणि पुढे कसं शिकणार. because, but आणि so वापरा.",
  },
  {
    day: 6,
    label: "रोजचे प्रसंग",
    theme: "Real-life situations",
    goal: "डॉक्टर, फोन, पत्ता विचारणे आणि नम्रपणे मागणी करायला शिका",
    vocab: [
      v("Appointment", "भेटीची वेळ", "अपॉइंटमेंट", "I have an appointment at five."),
      v("Problem", "समस्या", "प्रॉब्लेम", "I have a problem."),
      v("Headache", "डोकेदुखी", "हेडेक", "I have a headache."),
      v("Medicine", "औषध", "मेडिसिन", "Take this medicine twice a day."),
      v("Call", "फोन करणे", "कॉल", "Please call me later."),
      v("Message", "संदेश", "मेसेज", "I got your message."),
      v("Address", "पत्ता", "अॅड्रेस", "What is your address?"),
      v("Wrong", "चुकीचं", "रॉंग", "This answer is wrong."),
      v("Correct", "बरोबर", "करेक्ट", "Your answer is correct."),
      v("Careful", "सावध", "केअरफुल", "Be careful on the road."),
      v("Quick / Slow", "जलद / हळू", "क्विक / स्लो", "Please speak slowly."),
      v("Weather", "हवामान", "वेदर", "The weather is nice today."),
      v("Hot / Cold", "गरम / थंड", "हॉट / कोल्ड", "It is very hot today."),
      v("Again", "पुन्हा", "अगेन", "Please say it again."),
      v("Because of", "मुळे", "बिकॉज ऑफ", "I am late because of traffic."),
    ],
    grammar: [
      {
        title: "Polite requests: Can I / Could you / Would you like",
        rule: "नम्रपणे मागायला: Can I + V1? (मी... करू का?), Could you + V1? (तुम्ही... कराल का?), Would you like + noun? (तुम्हाला... आवडेल का?).",
        examples: [
          { en: "Can I have some water?", mr: "मला थोडं पाणी मिळेल का?" },
          { en: "Could you help me, please?", mr: "तुम्ही मला मदत कराल का?" },
          { en: "Would you like some tea?", mr: "तुम्हाला चहा आवडेल का?" },
        ],
      },
      {
        title: "Comparing: bigger than, more important than",
        rule: "लहान शब्दाला -er + than (taller than). लांब शब्दाला more + शब्द + than (more important than).",
        examples: [
          { en: "My brother is taller than me.", mr: "माझा भाऊ माझ्यापेक्षा उंच आहे." },
          { en: "This phone is cheaper than that one.", mr: "हा फोन त्यापेक्षा स्वस्त आहे." },
          { en: "English is more important than I thought.", mr: "इंग्रजी मला वाटलं त्यापेक्षा जास्त महत्त्वाचं आहे." },
        ],
      },
    ],
    verbs: [
      vb("ask", "asked", "asked", "विचारणे"),
      vb("answer", "answered", "answered", "उत्तर देणे"),
      vb("help", "helped", "helped", "मदत करणे"),
      vb("start", "started", "started", "सुरू करणे"),
      vb("stop", "stopped", "stopped", "थांबवणे"),
      vb("try", "tried", "tried", "प्रयत्न करणे"),
      vb("use", "used", "used", "वापरणे"),
      vb("work", "worked", "worked", "काम करणे"),
    ],
    speakingTopics: ["doctor", "phone"],
    sentences: [
      "माफ करा, तुम्ही मला मदत करू शकता का?",
      "मला डोकेदुखी आहे.",
      "कृपया हळू बोला.",
      "कृपया पुन्हा सांगा.",
      "तुमचा पत्ता काय आहे?",
      "आज खूप गरम आहे.",
    ],
    writingPrompt: "Imagine you are sick. Write 5 sentences to a doctor or a friend explaining your problem.",
    writingPromptMr: "तुम्ही आजारी आहात अशी कल्पना करा. डॉक्टर किंवा मित्राला तुमची समस्या सांगणारी ५ वाक्यं लिहा.",
  },
  {
    day: 7,
    label: "उजळणी",
    theme: "Revision & fluency",
    goal: "आतापर्यंत शिकलेलं एकत्र वापरा आणि न समजल्यास कसं विचारायचं ते शिका",
    vocab: [
      v("Excuse me", "माफ करा (लक्ष वेधायला)", "एक्स्क्यूज मी", "Excuse me, where is the station?"),
      v("I don't understand", "मला समजत नाही", "आय डोंट अंडरस्टँड", "Sorry, I don't understand."),
      v("Can you repeat?", "पुन्हा सांगाल का?", "कॅन यू रिपीट", "Can you repeat that, please?"),
      v("Speak slowly, please", "कृपया हळू बोला", "स्पीक स्लोली प्लीज", "Speak slowly, please. I am learning."),
      v("What does it mean?", "याचा अर्थ काय?", "व्हॉट डझ इट मीन", "What does 'appointment' mean?"),
      v("How do you say...?", "...इंग्रजीत कसं म्हणतात?", "हाऊ डू यू से", "How do you say 'पाणी' in English?"),
      v("Nice to meet you", "तुम्हाला भेटून आनंद झाला", "नाईस टू मीट यू", "Nice to meet you, Mr. Patil."),
      v("See you later", "नंतर भेटू", "सी यू लेटर", "Bye, see you later."),
      v("Take care", "काळजी घ्या", "टेक केअर", "Take care and drive slowly."),
      v("I'm not sure", "मला खात्री नाही", "आयम नॉट शुअर", "I'm not sure about the time."),
      v("That's great", "खूप छान", "दॅट्स ग्रेट", "You passed? That's great!"),
      v("No problem", "काही हरकत नाही", "नो प्रॉब्लेम", "Thanks! No problem."),
      v("Of course", "अर्थातच", "ऑफ कोर्स", "Of course, I can help."),
      v("Just a moment", "एक मिनिट", "जस्ट अ मोमेंट", "Just a moment, please."),
      v("I agree", "मी सहमत आहे", "आय अग्री", "I agree with you."),
    ],
    grammar: [
      {
        title: "Sentence order: Subject + Verb + Object",
        rule: "मराठीत verb शेवटी येतो, इंग्रजीत मधे. मी (S) + खातो (V) + भात (O) → I (S) eat (V) rice (O). नेहमी हा क्रम वापरा.",
        examples: [
          { en: "I eat rice.", mr: "मी भात खातो." },
          { en: "She reads a book.", mr: "ती पुस्तक वाचते." },
          { en: "They play cricket on Sunday.", mr: "ते रविवारी क्रिकेट खेळतात." },
        ],
      },
      {
        title: "Negatives & questions: don't / doesn't / didn't",
        rule: "आता / रोज: don't, doesn't + V1; Do, Does + subject + V1? भूतकाळ: didn't + V1; Did + subject + V1? नंतरचा verb नेहमी V1.",
        examples: [
          { en: "I don't know.", mr: "मला माहीत नाही." },
          { en: "Does she work here?", mr: "ती इथे काम करते का?" },
          { en: "I didn't go yesterday.", mr: "मी काल गेलो नाही." },
        ],
      },
    ],
    verbs: [
      vb("send", "sent", "sent", "पाठवणे"),
      vb("spend", "spent", "spent", "खर्च करणे"),
      vb("wear", "wore", "worn", "घालणे"),
      vb("drive", "drove", "driven", "गाडी चालवणे"),
      vb("fall", "fell", "fallen", "पडणे"),
      vb("hear", "heard", "heard", "ऐकणे"),
      vb("sing", "sang", "sung", "गाणे"),
      vb("swim", "swam", "swum", "पोहणे"),
    ],
    speakingTopics: ["free", "intro"],
    sentences: [
      "मी रोज इंग्रजी शिकतो.",
      "काल मी माझ्या मित्राला भेटलो.",
      "उद्या मी ऑफिसला जाणार आहे.",
      "तुम्ही हळू बोलू शकता का?",
      "मला थोडं इंग्रजी येतं, पण मी रोज शिकतो.",
      "मला हे समजलं नाही, कृपया पुन्हा सांगा.",
    ],
    writingPrompt:
      "Write a paragraph (8-10 sentences) introducing yourself: who you are, what you did this week, and your plans for next week.",
    writingPromptMr:
      "स्वतःची ओळख करून देणारा ८-१० वाक्यांचा परिच्छेद लिहा: तुम्ही कोण आहात, या आठवड्यात काय केलं, आणि पुढच्या आठवड्याचे प्लॅन्स.",
  },
];
