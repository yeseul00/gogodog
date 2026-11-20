import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Application ErrorBoundary caught an error:', error, info);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="h-[100dvh] w-full flex items-center justify-center p-6 watercolor-paper-bg">
          <div className="w-full max-w-[340px] rounded-[28px] bg-[#FFFDF9]/95 border border-white/90 shadow-[0_18px_44px_rgba(78,56,40,0.2)] p-6 text-center">
            <h1 className="font-display text-2xl text-[#4A3528]">잠시 문제가 생겼어요</h1>
            <p className="mt-2 text-sm text-[#745E4E] leading-relaxed">
              화면을 새로 불러오면 땡콩이와 다시 산책을 이어갈 수 있어요.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 w-full min-h-[48px] rounded-[18px] bg-[#D67844] hover:bg-[#C46936] text-[#FFFDF9] font-display text-lg shadow-[0_6px_18px_rgba(214,120,68,0.28)] cursor-pointer"
            >
              다시 불러오기
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
