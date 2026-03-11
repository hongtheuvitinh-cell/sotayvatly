export interface Example {
  title: string;
  problem: string;
  solution: string;
}

export interface Lesson {
  id: string;
  title: string;
  formula: string;
  description: string;
  examples: Example[];
}

export interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

export const CHAPTERS: Chapter[] = [
  {
    id: "c1",
    title: "Chương 1: Hàm số lượng giác",
    lessons: [
      {
        id: "l1-1",
        title: "Các công thức lượng giác cơ bản",
        description: "Các hệ thức cơ bản giữa các giá trị lượng giác của cùng một cung.",
        formula: "$$\\sin^2 x + \\cos^2 x = 1$$\n$$1 + \\tan^2 x = \\frac{1}{\\cos^2 x}, x \\neq \\frac{\\pi}{2} + k\\pi$$\n$$1 + \\cot^2 x = \\frac{1}{\\sin^2 x}, x \\neq k\\pi$$",
        examples: [
          {
            title: "Ví dụ 1: Tính giá trị lượng giác",
            problem: "Cho $\\sin x = 3/5$ và $\\pi/2 < x < \\pi$. Tính $\\cos x$.",
            solution: "Vì $\\sin^2 x + \\cos^2 x = 1$ nên $\\cos^2 x = 1 - (3/5)^2 = 16/25$. Do $\\pi/2 < x < \\pi$ nên $\\cos x < 0$. Vậy $\\cos x = -4/5$."
          }
        ]
      },
      {
        id: "l1-2",
        title: "Công thức cộng",
        description: "Công thức tính giá trị lượng giác của tổng hoặc hiệu hai góc.",
        formula: "$$\\cos(a-b) = \\cos a \\cos b + \\sin a \\sin b$$\n$$\\cos(a+b) = \\cos a \\cos b - \\sin a \\sin b$$\n$$\\sin(a-b) = \\sin a \\cos b - \\cos a \\sin b$$\n$$\\sin(a+b) = \\sin a \\cos b + \\cos a \\sin b$$",
        examples: [
          {
            title: "Ví dụ 1: Tính giá trị biểu thức",
            problem: "Tính $\\sin(15^\\circ)$.",
            solution: "$\\sin(15^\\circ) = \\sin(45^\\circ - 30^\\circ) = \\sin 45^\\circ \\cos 30^\\circ - \\cos 45^\\circ \\sin 30^\\circ = \\frac{\\sqrt{2}}{2} \\cdot \\frac{\\sqrt{3}}{2} - \\frac{\\sqrt{2}}{2} \\cdot \\frac{1}{2} = \\frac{\\sqrt{6}-\\sqrt{2}}{4}$."
          }
        ]
      }
    ]
  },
  {
    id: "c2",
    title: "Chương 2: Đạo hàm",
    lessons: [
      {
        id: "l2-1",
        title: "Đạo hàm của các hàm số sơ cấp",
        description: "Bảng đạo hàm của các hàm số thường gặp.",
        formula: "$$(x^n)' = n \\cdot x^{n-1}$$\n$$(\\sin x)' = \\cos x$$\n$$(\\cos x)' = -\\sin x$$\n$$(e^x)' = e^x$$",
        examples: [
          {
            title: "Ví dụ 1: Tính đạo hàm",
            problem: "Tính đạo hàm của hàm số $y = x^3 + \\sin x$.",
            solution: "$y' = (x^3)' + (\\sin x)' = 3x^2 + \\cos x$."
          }
        ]
      }
    ]
  }
];
