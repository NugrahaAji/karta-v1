declare module 'lenis' {
  export default class Lenis {
    constructor(options?: any);
    raf(time: number): void;
    destroy(): void;
    on(event: string, callback: (e: any) => void): void;
    stop(): void;
    start(): void;
    scrollTo(target: any, options?: any): void;
  }
}
