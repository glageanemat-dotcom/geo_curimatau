import Phaser from 'phaser';
import type { BaseActivity, Difficulty, Grade, MissionDatabase } from '../types/Activity';

export class ActivitySystem {
  private db!: MissionDatabase;
  private queue: BaseActivity[] = [];
  private index = 0;
  private score = 0;
  private attempts = 0;

  constructor(private scene: Phaser.Scene) {}

  load(cacheKey = 'mission1'): void {
    this.db = this.scene.cache.json.get(cacheKey) as MissionDatabase;
    if (!this.db?.activities) throw new Error(`Banco ${cacheKey} não foi carregado.`);
  }

  prepare(grade: Grade, difficulty?: Difficulty): BaseActivity[] {
    const eligible = this.db.activities.filter(a =>
      a.grade === grade && (!difficulty || a.difficulty === difficulty)
    );
    this.queue = eligible.length ? eligible : this.db.activities.filter(a => a.grade === grade);
    this.index = 0; this.score = 0; this.attempts = 0;
    return this.queue;
  }

  current(): BaseActivity | undefined { return this.queue[this.index]; }
  hasNext(): boolean { return this.index < this.queue.length - 1; }
  next(): BaseActivity | undefined { this.index++; this.attempts = 0; return this.current(); }
  getProgress() { return { current: Math.min(this.index + 1, this.queue.length), total: this.queue.length, score: this.score }; }
  hint(): string | undefined { const a=this.current(); return a?.hints[Math.min(this.attempts, Math.max(0,a.hints.length-1))]; }

  answer(correct: boolean): { message: string; score: number; attempts: number } {
    const a = this.current(); if (!a) return { message:'', score:this.score, attempts:this.attempts };
    if (correct) { this.score += a.points; return { message:a.feedback.correct, score:this.score, attempts:this.attempts }; }
    this.attempts++;
    const key = `incorrect${Math.min(this.attempts,3)}` as keyof typeof a.feedback;
    return { message: (a.feedback[key] as string) || this.hint() || 'Observe novamente e tente outra vez.', score:this.score, attempts:this.attempts };
  }

  completionBonus(): number { return this.db.missionCompletion.completionBonus; }
  addCompletionBonus(): number { this.score += this.completionBonus(); return this.score; }
  getScore(): number { return this.score; }
}
