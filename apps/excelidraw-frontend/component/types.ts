// Tool types
export type Tool =
  | "circle"
  | "rect"
  | "line"
  | "erase"
  | "pencil"
  | "text"
  | "colorpicker"
  | "ellipse"
  | "triangle";

// Styling types
export type GradientType = "linear" | "radial" | "none";
export type StrokePattern = "solid" | "dashed" | "dotted" | "dash-dot";

export interface Gradient {
  type: GradientType;
  colors: string[];
  stops: number[];
  angle?: number; // For linear gradients
  centerX?: number; // For radial gradients
  centerY?: number; // For radial gradients
}

export interface StrokeStyle {
  type: StrokePattern;
  width: number;
  dashArray?: number[]; // For custom patterns
}

export interface ShapeStyle {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  opacity: number;
  gradient?: Gradient;
  textColor?: string;
  designColor?: string;
}

export type Shape =
  | {
    id: string;
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    style?: ShapeStyle;
  }
  | {
    id: string;
    type: "ellipse";
    x: number;
    y: number;
    width: number;
    height: number;
    style?: ShapeStyle;
  }
  | {
    id: string;
    type: "triangle";
    x: number;
    y: number;
    width: number;
    height: number;
    style?: ShapeStyle;
  }
  | {
    id: string;
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
    style?: ShapeStyle;
  }
  | {
    id: string;
    type: "line";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    style?: ShapeStyle;
  }
  | {
    id: string;
    type: "path";
    points: { x: number; y: number }[];
    style?: ShapeStyle;
  }
  | {
    id: string;
    type: "text";
    x: number;
    y: number;
    text: string;
    fontSize: number;
    color: string;
    style?: ShapeStyle;
  };

// AI Analysis types
export interface AIAnalysisResult {
  shapes?: any;
  diagram?: any;
  text?: any;
  suggestions?: any;
}

// User tracking types
export interface ConnectedUser {
  userId: string;
  userName?: string;
  isDrawing?: boolean;
  lastActivity?: number;
  userColor?: string; // For visual distinction
}

// Canvas state types
export interface CanvasState {
  selectedTool: Tool;
  isConnected: boolean;
  participantCount: number;
  showWelcome: boolean;
  showQuickTips: boolean;
  canvasSize: { width: number; height: number };
  isPanning: boolean;
  selectedShape: Shape | null;
}

// AI Tools State types
export interface AIToolsState {
  showAIPanel: boolean;
  aiLoading: boolean;
  aiOperation: string;
  aiResult: AIAnalysisResult | null;
  aiError: string;
  selectedFile: File | null;
  aiPrompt: string;
  aiContext: string;
  liveAIShape: boolean;
  shapeDetectionTimeout: NodeJS.Timeout | null;
  lastDrawnShape: any;
  isConvertingShape: boolean;
}

// Text Tool State types
export interface TextToolState {
  isTyping: boolean;
  currentTextShapeId: string | null;
  textInput: string;
  editingShape?: Shape | null;
}

// UI State types
export interface UIState {
  showQuickTips: boolean;
  showStylingPanel: boolean;
  showLayersPanel: boolean;
  showColorPopup: boolean;
  colorPopupPosition: { x: number; y: number };
}

// Styling State types
export interface StylingState {
  selectedColorType: 'stroke' | 'fill' | 'text';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  strokeStyle: StrokePattern;
  gradientType: GradientType;
  gradientColors: string[];
  textColor: string;
  designColor: string;
}

// Drawing Challenges types
export interface ChallengeCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  prompt: string;
  categoryId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  imageUrl?: string;
  tags: string[];
  category: ChallengeCategory;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    submissions: number;
  };
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  title?: string;
  description?: string;
  imageUrl: string;
  canvasData?: string;
  likes: number;
  isPublic: boolean;
  submittedAt: Date;
  challenge: Challenge;
  user: {
    id: string;
    name: string;
    photo?: string;
  };
}

export interface ChallengeState {
  challenges: Challenge[];
  currentChallenge: Challenge | null;
  userSubmissions: ChallengeSubmission[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: string | null;
  selectedDifficulty: string | null;
  showChallengeModal: boolean;
  showSubmissionModal: boolean;
  submissionForm: {
    title: string;
    description: string;
    isPublic: boolean;
  };
}
