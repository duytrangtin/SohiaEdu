import { GoogleGenAI, Type } from "@google/genai";
import { Question, Topic, EvaluationResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const modelId = 'gemini-2.5-flash';

// --- DỮ LIỆU DỰ PHÒNG (OFFLINE MODE) ---
// Dùng khi API bị lỗi hoặc hết quota
interface FallbackItem {
  text: string;
  hint: string;
  expectedOutputDescription: string;
  check: (code: string) => boolean;
  mockOutput: string;
}

const FALLBACK_DATA: Record<Topic, FallbackItem[]> = {
  [Topic.SEQUENTIAL]: [
    {
      text: 'Viết chương trình in ra dòng chữ "Hello Python" (lưu ý viết chính xác).',
      hint: 'Sử dụng hàm print()',
      expectedOutputDescription: 'Hello Python',
      check: (c) => /print\s*\(\s*["']Hello Python["']\s*\)/.test(c),
      mockOutput: 'Hello Python'
    },
    {
      text: 'Khai báo biến a = 10, b = 5. Tính và in ra tổng của a và b.',
      hint: 'Dùng toán tử +',
      expectedOutputDescription: '15',
      check: (c) => (/a\s*=\s*10/.test(c) && /b\s*=\s*5/.test(c) && /print/.test(c) && /\+/.test(c)) || /print\s*\(\s*15\s*\)/.test(c),
      mockOutput: '15'
    },
    {
      text: 'Viết chương trình nhập tên người dùng và in ra "Xin chao".',
      hint: 'input() và print()',
      expectedOutputDescription: 'Xin chao',
      check: (c) => /print\s*\(\s*["']Xin chao["']\s*\)/.test(c),
      mockOutput: 'Xin chao'
    }
  ],
  [Topic.BRANCHING]: [
    {
      text: 'Viết code kiểm tra: nếu 10 > 5 thì in ra "Dung".',
      hint: 'Dùng câu lệnh if',
      expectedOutputDescription: 'Dung',
      check: (c) => /if\s+10\s*>\s*5\s*:/.test(c) && /print\s*\(\s*["']Dung["']\s*\)/.test(c),
      mockOutput: 'Dung'
    },
    {
      text: 'Cho x = 4. Kiểm tra nếu x % 2 == 0 thì in ra "Chan".',
      hint: 'Toán tử % là chia lấy dư',
      expectedOutputDescription: 'Chan',
      check: (c) => /if.*%.*==.*0.*:/.test(c) && /print/.test(c),
      mockOutput: 'Chan'
    }
  ],
  [Topic.LOOP]: [
    {
      text: 'Sử dụng vòng lặp for để in ra các số từ 0 đến 2.',
      hint: 'Dùng range(3)',
      expectedOutputDescription: '0\n1\n2',
      check: (c) => /for\s+\w+\s+in\s+range\s*\(\s*3\s*\)\s*:/.test(c) && /print/.test(c),
      mockOutput: '0\n1\n2'
    },
    {
      text: 'Tính tổng các số từ 1 đến 3 (1+2+3) và in ra kết quả.',
      hint: 'Kết quả là 6',
      expectedOutputDescription: '6',
      check: (c) => /print/.test(c) && /6/.test(c),
      mockOutput: '6'
    }
  ],
  [Topic.COMBINED]: [
    {
      text: 'Viết chương trình kiểm tra số 5 có lớn hơn 3 không, nếu có in "OK".',
      hint: 'if 5 > 3:',
      expectedOutputDescription: 'OK',
      check: (c) => /if\s+5\s*>\s*3\s*:/.test(c) && /print/.test(c),
      mockOutput: 'OK'
    }
  ]
};

export const generateQuestion = async (topic: Topic): Promise<Question> => {
  const randomId = Math.floor(Math.random() * 1000) + 1;

  // 1. Cố gắng gọi API
  try {
    const prompt = `
      Bạn là một giáo viên tin học THPT tại Việt Nam.
      Hãy soạn thảo câu hỏi trắc nghiệm thực hành code Python về chủ đề: "${topic}".
      Yêu cầu: Ngắn gọn, yêu cầu in ra kết quả cụ thể để dễ kiểm tra.
      Trả về kết quả dưới dạng JSON object duy nhất: { text, hint, expectedOutputDescription }.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "Nội dung câu hỏi" },
            hint: { type: Type.STRING },
            expectedOutputDescription: { type: Type.STRING }
          },
          required: ["text", "expectedOutputDescription"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    return {
      id: `${topic}-${randomId}-${Date.now()}`,
      topic,
      text: data.text || `Bài tập về ${topic}`,
      hint: data.hint,
      expectedOutputDescription: data.expectedOutputDescription
    };

  } catch (error) {
    console.warn("⚠️ Gemini API Error (Quota/Network). Using Offline Fallback.", error);
    
    // 2. Nếu lỗi, dùng dữ liệu Offline
    const items = FALLBACK_DATA[topic] || FALLBACK_DATA[Topic.SEQUENTIAL];
    const index = Math.floor(Math.random() * items.length);
    const item = items[index];
    
    // Tạo ID đặc biệt để nhận biết là câu hỏi offline: fallback#TOPIC#INDEX#TIME
    return {
      id: `fallback#${topic}#${index}#${Date.now()}`,
      topic,
      text: item.text,
      hint: item.hint,
      expectedOutputDescription: item.expectedOutputDescription
    };
  }
};

export const evaluateStudentCode = async (question: Question, code: string): Promise<EvaluationResult> => {
  if (!code.trim()) {
    return {
      correct: false,
      message: "Bạn chưa nhập mã lệnh nào cả. Hãy thử viết gì đó nhé!",
      output: ""
    };
  }

  // 1. Kiểm tra xem có phải câu hỏi Offline không (dựa vào ID)
  if (question.id.startsWith('fallback#')) {
    try {
      const parts = question.id.split('#'); // ["fallback", "TOPIC", "INDEX", "TIME"]
      const topic = parts[1] as Topic;
      const index = parseInt(parts[2], 10);
      
      const item = FALLBACK_DATA[topic]?.[index];
      if (item) {
        const isCorrect = item.check(code);
        return {
          correct: isCorrect,
          message: isCorrect ? "Chính xác! (Chấm Offline)" : "Chưa đúng logic yêu cầu. Kiểm tra lại nhé!",
          output: isCorrect ? item.mockOutput : "Error/Incorrect Output"
        };
      }
    } catch (e) {
      console.error("Error checking fallback", e);
    }
  }

  // 2. Nếu là câu hỏi Online, gọi API để chấm
  try {
    const prompt = `
      Vai trò: Trình chấm bài Python.
      Đề bài: "${question.text}"
      Yêu cầu output: "${question.expectedOutputDescription}"
      Code học sinh:
      \`\`\`python
      ${code}
      \`\`\`
      Nhiệm vụ:
      - Kiểm tra code có giải quyết đúng bài toán không.
      - Trả về JSON: { correct: boolean, message: string, output: string }.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correct: { type: Type.BOOLEAN },
            message: { type: Type.STRING },
            output: { type: Type.STRING }
          },
          required: ["correct", "message", "output"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      correct: result.correct ?? false,
      message: result.message || "Chưa chính xác.",
      output: result.output || "Error"
    };
  } catch (error) {
    console.error("Gemini API Error (Eval):", error);
    // Nếu API chấm bài lỗi, trả về thông báo thân thiện thay vì lỗi hệ thống
    return {
      correct: false,
      message: "Hệ thống đang bận (Hết lượt dùng API). Vui lòng thử lại sau hoặc F5.",
      output: "Service Unavailable"
    };
  }
};