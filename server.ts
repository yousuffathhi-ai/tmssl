import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of Gemini client according to guidelines
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TMS SL Server',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// AI Lesson Plan Generator endpoint using Gemini
app.post('/api/lesson-plan/generate', async (req, res) => {
  try {
    const { grade, subject, unitTopic, competencyLevel, periodDuration, medium, additionalNotes } = req.body;

    if (!grade || !subject || !unitTopic) {
      return res.status(400).json({ error: 'Grade, subject, and unit/topic are required.' });
    }

    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are a curriculum specialist and master teacher trained by Sri Lanka's National Institute of Education (NIE).
Create a comprehensive, structured lesson plan for a Sri Lankan government or private school teacher.

Details:
- Target Grade: ${grade}
- Subject: ${subject}
- Unit / Topic: ${unitTopic}
- Competency / Competency Level: ${competencyLevel || 'Standard NIE grade competency'}
- Period Duration: ${periodDuration || 40} minutes
- Medium of Instruction: ${medium || 'English'}
${additionalNotes ? `- Specific Teacher Focus: ${additionalNotes}` : ''}

Generate a strictly valid JSON response (no markdown code blocks, just pure JSON) with this exact schema:
{
  "title": "${subject} - ${unitTopic} (Grade ${grade})",
  "learningOutcomes": [
    "Outcome 1",
    "Outcome 2",
    "Outcome 3"
  ],
  "tlms": [
    "Teaching-Learning Aid 1",
    "Teaching-Learning Aid 2",
    "Teaching-Learning Aid 3"
  ],
  "lessonFlow": [
    {
      "step": "Introduction / Engagement",
      "timeMinutes": 7,
      "teacherActivity": "Detailed teacher guidance to stimulate interest...",
      "studentActivity": "What students will observe, answer, or brainstorm...",
      "assessmentPoints": "Formative check indicator..."
    },
    {
      "step": "Exploration & Main Activity",
      "timeMinutes": 20,
      "teacherActivity": "Demonstration, explanation, guided inquiry...",
      "studentActivity": "Hands-on work, group discussion, textbook exercise...",
      "assessmentPoints": "Student understanding check..."
    },
    {
      "step": "Synthesis & Elaboration",
      "timeMinutes": 8,
      "teacherActivity": "Summarizing key ideas and connecting to real-world Sri Lankan context...",
      "studentActivity": "Presenting findings or completing workbook questions...",
      "assessmentPoints": "Evaluation of student mastery..."
    },
    {
      "step": "Evaluation & Wrap-up",
      "timeMinutes": 5,
      "teacherActivity": "Asking quick recap questions and assigning reflection...",
      "studentActivity": "Exit ticket or quick oral recap response...",
      "assessmentPoints": "Final mastery metric..."
    }
  ],
  "evaluationQuestions": [
    "Recap / Assessment Question 1",
    "Recap / Assessment Question 2",
    "Critical thinking Question 3"
  ],
  "differentiatedLearning": {
    "remedialTasks": [
      "Targeted scaffolded task for students needing extra support",
      "Visual diagram or vocabulary reinforcement"
    ],
    "enrichmentTasks": [
      "Advanced research or real-life problem solving challenge",
      "Peer-leader task or creative application"
    ]
  },
  "teacherReflection": "Practical tips on time management, common student misconceptions in this topic, and NIE assessment guidelines."
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        return res.json({ success: true, plan: parsed });
      } catch (geminiError: any) {
        console.warn('Gemini generation fallback engaged:', geminiError?.message);
        // If Gemini error occurs, proceed to rich Sri Lankan curriculum fallback generator
      }
    }

    // High quality deterministic Sri Lankan NIE template generator fallback
    const fallbackPlan = {
      title: `${subject}: ${unitTopic} (Grade ${grade})`,
      learningOutcomes: [
        `Understand and state the foundational principles of ${unitTopic} according to NIE Grade ${grade} syllabus.`,
        `Apply conceptual knowledge to solve practical Sri Lankan context examples and problems.`,
        `Demonstrate critical thinking and collaborative problem solving during classroom activities.`,
        `Accurately document observations and conclude findings in students' standard exercise books.`,
      ],
      tlms: [
        `Prescribed NIE Grade ${grade} ${subject} National Textbook`,
        `Whiteboard, color markers, and printed flashcards for ${unitTopic}`,
        `Real-life multimedia / physical specimens or chart illustrating ${unitTopic}`,
        `Student Activity Worksheet prepared by the teacher`,
      ],
      lessonFlow: [
        {
          step: 'Engage & Introduction (Recap & Motivation)',
          timeMinutes: Math.round((periodDuration || 40) * 0.15),
          teacherActivity: `Greets class, conducts 2-minute recap of previous lesson, and introduces an intriguing real-life Sri Lankan situation connected to ${unitTopic}.`,
          studentActivity: `Students respond to introductory questions, activate prior knowledge, and note down today's lesson title in their workbooks.`,
          assessmentPoints: `Check readiness and identify baseline misconceptions among learners.`,
        },
        {
          step: 'Explore & Explain (Core Instruction & Demonstration)',
          timeMinutes: Math.round((periodDuration || 40) * 0.5),
          teacherActivity: `Delivers core concept of ${unitTopic} step-by-step using interactive diagramming, worked examples on the board, and guided questioning.`,
          studentActivity: `Follow teacher demonstration, participate in structured choral and individual responses, and complete sample problems in pairs.`,
          assessmentPoints: `Observe pair discussions and check individual student desk work.`,
        },
        {
          step: 'Elaborate & Group Practice (Peer Application)',
          timeMinutes: Math.round((periodDuration || 40) * 0.22),
          teacherActivity: `Circulates among student rows to provide scaffolded support, clarify doubts, and monitor cooperative problem solving.`,
          studentActivity: `Small groups work through assigned exercises or case studies on ${unitTopic}, debating answers and writing solutions.`,
          assessmentPoints: `Verify step-by-step accuracy and active participation of every group member.`,
        },
        {
          step: 'Evaluate & Review (Formative Assessment & Closure)',
          timeMinutes: Math.round((periodDuration || 40) * 0.13),
          teacherActivity: `Facilitates quick 3-question rapid-fire plenary to summarize core competencies, assigns homework, and introduces tomorrow's topic.`,
          studentActivity: `Answer rapid-fire questions, write down homework assignment, and pack materials neatly.`,
          assessmentPoints: `Gauge whether at least 80% of students achieved the primary learning outcome.`,
        },
      ],
      evaluationQuestions: [
        `Define the key terminology related to ${unitTopic} in your own words.`,
        `Explain how ${unitTopic} is applied in everyday Sri Lankan industry, environment, or daily routine.`,
        `Solve the sample question from the NIE Teacher's Instructional Manual (TIM) for Grade ${grade}.`,
      ],
      differentiatedLearning: {
        remedialTasks: [
          `Provide labeled template diagram with word-bank for step-by-step matching.`,
          `Peer-assisted review of foundational definitions before attempting complex calculations/concepts.`,
        ],
        enrichmentTasks: [
          `Research a recent local Sri Lankan case study or news article linked to ${unitTopic}.`,
          `Formulate a 3-minute presentation or mini-poster explaining advanced applications.`,
        ],
      },
      teacherReflection: `Ensure pacing allows adequate time for student pair-work. Emphasize bilingual vocabulary where applicable for English medium students.`,
    };

    return res.json({ success: true, plan: fallbackPlan });
  } catch (error: any) {
    console.error('Server error generating lesson plan:', error);
    res.status(500).json({ error: 'Failed to generate lesson plan: ' + error.message });
  }
});

async function startServer() {
  // Vite middleware for development
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
    console.log(`TMS SL Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
