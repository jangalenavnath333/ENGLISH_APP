export interface PassageQuestion {
  q: string;
  qMr: string;
  options: string[];
  answer: number; // index in options
}

export interface DayPractice {
  dictation: string[]; // short sentences the student hears and types
  passage: {
    title: string;
    text: string;
    mr: string; // Marathi translation
    questions: PassageQuestion[];
  };
}

// Listening (dictation + story) and Reading (same story with tap-to-translate) content for each plan day
export const PRACTICE: Record<number, DayPractice> = {
  1: {
    dictation: ["My name is Rahul.", "I am a student.", "This is my phone.", "I want water."],
    passage: {
      title: "Meet Rahul",
      text: "Hello! My name is Rahul. I am a student. I live in Pune. This is my friend, Amit. Amit likes tea. I like water. We are good friends.",
      mr: "नमस्कार! माझं नाव राहुल आहे. मी विद्यार्थी आहे. मी पुण्यात राहतो. हा माझा मित्र अमित आहे. अमितला चहा आवडतो. मला पाणी आवडतं. आम्ही चांगले मित्र आहोत.",
      questions: [
        { q: "Where does Rahul live?", qMr: "राहुल कुठे राहतो?", options: ["Pune", "Mumbai", "Delhi"], answer: 0 },
        { q: "What does Amit like?", qMr: "अमितला काय आवडतं?", options: ["Tea", "Water", "Food"], answer: 0 },
        { q: "Who is Amit?", qMr: "अमित कोण आहे?", options: ["Rahul's friend", "Rahul's father", "Rahul's teacher"], answer: 0 },
      ],
    },
  },
  2: {
    dictation: ["I wake up at six.", "I eat breakfast at home.", "He goes to work by bus.", "What time is it?"],
    passage: {
      title: "A day in Rahul's life",
      text: "Rahul wakes up at six in the morning. He eats breakfast at seven. He goes to work by bus. He eats lunch at one. At night he eats dinner with his family. He sleeps at ten.",
      mr: "राहुल सकाळी सहा वाजता उठतो. तो सात वाजता नाश्ता करतो. तो बसने कामावर जातो. तो एक वाजता जेवतो. रात्री तो कुटुंबासोबत जेवण करतो. तो दहा वाजता झोपतो.",
      questions: [
        { q: "When does Rahul wake up?", qMr: "राहुल कधी उठतो?", options: ["At six", "At seven", "At ten"], answer: 0 },
        { q: "How does he go to work?", qMr: "तो कामावर कसा जातो?", options: ["By bus", "By train", "On foot"], answer: 0 },
        { q: "When does he sleep?", qMr: "तो कधी झोपतो?", options: ["At ten", "At six", "At one"], answer: 0 },
      ],
    },
  },
  3: {
    dictation: ["I went to the market yesterday.", "I bought a new shirt.", "Did you eat lunch?", "The price is too high."],
    passage: {
      title: "Yesterday at the market",
      text: "Yesterday I went to the market. I bought a shirt and a bag. The shirt was cheap, but the bag was expensive. I paid with cash. Then I met my friend and we drank tea.",
      mr: "काल मी बाजारात गेलो. मी एक शर्ट आणि एक बॅग विकत घेतली. शर्ट स्वस्त होता, पण बॅग महाग होती. मी रोख पैसे दिले. मग मी माझ्या मित्राला भेटलो आणि आम्ही चहा प्यायलो.",
      questions: [
        { q: "Where did the speaker go?", qMr: "बोलणारा कुठे गेला?", options: ["To the market", "To school", "To the hospital"], answer: 0 },
        { q: "What was expensive?", qMr: "काय महाग होतं?", options: ["The bag", "The shirt", "The tea"], answer: 0 },
        { q: "What did they drink?", qMr: "त्यांनी काय प्यायलं?", options: ["Tea", "Water", "Coffee"], answer: 0 },
      ],
    },
  },
  4: {
    dictation: ["I am going to visit Pune.", "I will call you tomorrow.", "Where is the bus stop?", "You should drink more water."],
    passage: {
      title: "Plans for Sunday",
      text: "Next Sunday I am going to visit my family in Pune. I will take the train at eight. The ticket is not expensive. I will call my mother from the station. We will have lunch together at home.",
      mr: "पुढच्या रविवारी मी पुण्यात माझ्या कुटुंबाला भेटायला जाणार आहे. मी आठ वाजता रेल्वे घेईन. तिकीट महाग नाही. मी स्टेशनवरून आईला फोन करेन. आम्ही घरी एकत्र जेवण करू.",
      questions: [
        { q: "Where is the speaker going?", qMr: "बोलणारा कुठे जात आहे?", options: ["To Pune", "To Mumbai", "To Delhi"], answer: 0 },
        { q: "How will he travel?", qMr: "तो कसा प्रवास करेल?", options: ["By train", "By bus", "By car"], answer: 0 },
        { q: "What will they do together?", qMr: "ते एकत्र काय करतील?", options: ["Have lunch", "Watch a movie", "Play cricket"], answer: 0 },
      ],
    },
  },
  5: {
    dictation: ["I am tired because I worked.", "I was hungry, so I ate.", "I think this is a good idea.", "She has finished her work."],
    passage: {
      title: "A tired day",
      text: "Today I am very tired because I worked all day. I am hungry, so I am eating dinner now. I want to sleep early, but I have an English lesson. I think English is difficult, but I always try.",
      mr: "आज मी खूप थकलो आहे, कारण मी दिवसभर काम केलं. मला भूक लागली आहे, म्हणून मी आता जेवण करत आहे. मला लवकर झोपायचं आहे, पण माझा इंग्रजीचा धडा आहे. मला वाटतं इंग्रजी कठीण आहे, पण मी नेहमी प्रयत्न करतो.",
      questions: [
        { q: "Why is he tired?", qMr: "तो का थकलाय?", options: ["He worked all day", "He ran a lot", "He did not sleep"], answer: 0 },
        { q: "Why is he eating dinner?", qMr: "तो जेवण का करतोय?", options: ["He is hungry", "He is happy", "He is angry"], answer: 0 },
        { q: "What does he think about English?", qMr: "त्याला इंग्रजीबद्दल काय वाटतं?", options: ["It is difficult", "It is easy", "It is boring"], answer: 0 },
      ],
    },
  },
  6: {
    dictation: ["I have a headache.", "Can I have some water?", "Could you help me, please?", "Please speak slowly."],
    passage: {
      title: "At the doctor",
      text: "Meena has a headache. She has an appointment with the doctor at five. The doctor says, take this medicine twice a day. Meena says, thank you. The doctor says, take care and drink water.",
      mr: "मीनाला डोकेदुखी आहे. तिची डॉक्टरांकडे पाच वाजता भेटीची वेळ आहे. डॉक्टर म्हणतात, हे औषध दिवसातून दोनदा घ्या. मीना म्हणते, धन्यवाद. डॉक्टर म्हणतात, काळजी घ्या आणि पाणी प्या.",
      questions: [
        { q: "What problem does Meena have?", qMr: "मीनाला काय त्रास आहे?", options: ["A headache", "A fever", "A cough"], answer: 0 },
        { q: "When is the appointment?", qMr: "भेटीची वेळ कधी आहे?", options: ["At five", "At six", "At nine"], answer: 0 },
        { q: "What does the doctor give?", qMr: "डॉक्टर काय देतात?", options: ["Medicine", "Water", "Tea"], answer: 0 },
      ],
    },
  },
  7: {
    dictation: ["Nice to meet you.", "Can you repeat that, please?", "I don't know, I'm not sure.", "Just a moment, please."],
    passage: {
      title: "Nice to meet you",
      text: "Hello, nice to meet you. My name is Rahul and I am learning English. Sorry, I don't understand. Can you repeat that, please? Thank you, that's great. I agree with you. See you later, take care!",
      mr: "नमस्कार, तुम्हाला भेटून आनंद झाला. माझं नाव राहुल आहे आणि मी इंग्रजी शिकतोय. माफ करा, मला समजलं नाही. कृपया पुन्हा सांगाल का? धन्यवाद, खूप छान. मी तुमच्याशी सहमत आहे. नंतर भेटू, काळजी घ्या!",
      questions: [
        { q: "What is Rahul learning?", qMr: "राहुल काय शिकतोय?", options: ["English", "Hindi", "Maths"], answer: 0 },
        { q: "What does he ask?", qMr: "तो काय विचारतो?", options: ["Can you repeat that?", "Open the door", "Give me water"], answer: 0 },
        { q: "How does he say goodbye?", qMr: "तो निरोप कसा घेतो?", options: ["See you later", "Good night", "Hello"], answer: 0 },
      ],
    },
  },
};
