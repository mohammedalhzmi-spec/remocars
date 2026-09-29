// Core Application Controllers and Game State Management
export class GameController {
  private static instance: GameController;

  private constructor() {}

  public static getInstance(): GameController {
    if (!GameController.instance) {
      GameController.instance = new GameController();
    }
    return GameController.instance;
  }

  public getVersion(): string {
    return '2.0.0-elite';
  }

  public getDeveloper(): string {
    return 'المطور محمد الحزمي 2026';
  }
}

export const gameController = GameController.getInstance();
