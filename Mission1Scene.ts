import Phaser from 'phaser';
import { ActivitySystem } from '../systems/ActivitySystem';
import type { BaseActivity, Grade } from '../types/Activity';

export class Mission1Scene extends Phaser.Scene {
  private activities!: ActivitySystem;
  private grade: Grade = 6;
  private content!: Phaser.GameObjects.Container;
  private scoreText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;

  constructor() { super('Mission1Scene'); }

  init(data: { grade?: Grade }) { this.grade = data.grade ?? 6; }

  preload() {
    this.load.json('mission1', 'assets/activities/missao1-formas-caatinga.json');
  }

  create() {
    this.cameras.main.setBackgroundColor('#E8D7A9');
    this.activities = new ActivitySystem(this);
    this.activities.load('mission1');
    this.activities.prepare(this.grade);

    this.add.text(32, 22, '🌵 Missão 1 — Formas da Caatinga', { fontFamily:'Arial', fontSize:'28px', color:'#263b25', fontStyle:'bold' });
    this.scoreText = this.add.text(32, 62, 'Pontos: 0', { fontFamily:'Arial', fontSize:'20px', color:'#263b25' });
    this.progressText = this.add.text(650, 62, '', { fontFamily:'Arial', fontSize:'18px', color:'#263b25' });
    this.feedbackText = this.add.text(60, 555, '', { fontFamily:'Arial', fontSize:'18px', color:'#263b25', wordWrap:{width:840}, align:'center' }).setOrigin(0,0.5);
    this.content = this.add.container(0,0);
    this.renderCurrent();
  }

  private renderCurrent() {
    this.content.removeAll(true);
    this.feedbackText.setText('');
    const activity = this.activities.current();
    if (!activity) return this.finishMission();
    const p = this.activities.getProgress();
    this.progressText.setText(`Atividade ${p.current}/${p.total} • ${this.grade}º ano`);

    this.content.add(this.add.text(60, 115, activity.instruction, { fontFamily:'Arial', fontSize:'24px', color:'#1f2d1f', wordWrap:{width:840} }));
    switch(activity.type) {
      case 'multiple-choice': return this.renderMultipleChoice(activity);
      case 'drag-drop': return this.renderDragDrop(activity);
      case 'drag-classification': return this.renderClassification(activity);
      case 'select-object': return this.renderSelectObject(activity);
      case 'select-multiple': return this.renderSelectMultiple(activity);
      case 'assemble-shape': return this.renderAssembly(activity);
      default: return this.renderUnsupported(activity);
    }
  }

  private button(x:number,y:number,label:string,onClick:()=>void,w=360) {
    const bg=this.add.rectangle(x,y,w,48,0xffffff,0.92).setStrokeStyle(2,0x52734d).setInteractive({useHandCursor:true});
    const tx=this.add.text(x,y,label,{fontFamily:'Arial',fontSize:'19px',color:'#263b25'}).setOrigin(.5);
    bg.on('pointerdown',onClick); this.content.add([bg,tx]); return bg;
  }

  private submit(correct:boolean) {
    const result=this.activities.answer(correct);
    this.scoreText.setText(`Pontos: ${result.score}`);
    this.feedbackText.setText(result.message);
    if(correct) this.time.delayedCall(1200,()=> this.activities.hasNext() ? (this.activities.next(),this.renderCurrent()) : this.finishMission());
  }

  private renderMultipleChoice(a: BaseActivity) {
    const options=(a.options as string[]) ?? [];
    options.forEach((option,i)=>this.button(480,230+i*60,option,()=>this.submit(option===a.correctAnswer)));
  }

  private renderDragDrop(a: BaseActivity) {
    const piece=this.add.rectangle(180,300,110,80,0xd98f39).setStrokeStyle(3,0x5c3a19).setInteractive({draggable:true});
    const label=this.add.text(180,300,'PEÇA',{fontFamily:'Arial',fontSize:'18px',color:'#fff'}).setOrigin(.5);
    const target=this.add.rectangle(700,300,160,120,0xffffff,.35).setStrokeStyle(3,0x52734d);
    const targetLabel=this.add.text(700,300,'DESTINO',{fontFamily:'Arial',fontSize:'17px',color:'#263b25'}).setOrigin(.5);
    this.input.setDraggable(piece);
    piece.on('drag',(_:unknown,x:number,y:number)=>{piece.setPosition(x,y);label.setPosition(x,y);});
    piece.on('dragend',()=>{ if(Phaser.Geom.Intersects.RectangleToRectangle(piece.getBounds(),target.getBounds())) this.submit(true); else {piece.setPosition(180,300);label.setPosition(180,300);this.submit(false);} });
    this.content.add([piece,label,target,targetLabel]);
  }

  private renderClassification(a: BaseActivity) {
    const categories=(a.categories as string[]) ?? [];
    const objects=(a.objects as Array<{id:string;category:string}>) ?? [];
    categories.forEach((c,i)=>{ const x=300+i*380; const zone=this.add.rectangle(x,390,300,180,0xffffff,.35).setStrokeStyle(3,0x52734d); zone.setData('category',c); this.content.add([zone,this.add.text(x,315,c,{fontFamily:'Arial',fontSize:'20px',color:'#263b25'}).setOrigin(.5)]); });
    let completed=0;
    objects.forEach((obj,i)=>{ const x=170+i*145; const piece=this.add.rectangle(x,220,120,52,0xf2c66d).setStrokeStyle(2,0x5c3a19).setInteractive({draggable:true}); piece.setData('answer',obj.category); const tx=this.add.text(x,220,obj.id,{fontFamily:'Arial',fontSize:'15px',color:'#263b25'}).setOrigin(.5); this.input.setDraggable(piece); piece.on('drag',(_:unknown,nx:number,ny:number)=>{piece.setPosition(nx,ny);tx.setPosition(nx,ny)}); piece.on('dragend',()=>{ const zone=this.children.list.find(g=>g instanceof Phaser.GameObjects.Rectangle && g.getData('category') && Phaser.Geom.Rectangle.Contains(g.getBounds(),piece.x,piece.y)) as Phaser.GameObjects.Rectangle|undefined; if(zone?.getData('category')===piece.getData('answer')){piece.disableInteractive(); completed++; if(completed===objects.length)this.submit(true);} else {piece.setPosition(x,220);tx.setPosition(x,220);this.submit(false);} }); this.content.add([piece,tx]); });
  }

  private renderSelectObject(a: BaseActivity) {
    const valid=(a.validTargets as string[]) ?? [];
    ['janela_casa','telhado_casa','serra_geometrica','circle_sun'].forEach((id,i)=>this.button(260+(i%2)*440,245+Math.floor(i/2)*80,id.replaceAll('_',' '),()=>this.submit(valid.includes(id)),300));
  }

  private renderSelectMultiple(a: BaseActivity) {
    const raw=(a.objects ?? a.options) as Array<string|{id:string;text?:string}>;
    const correct=new Set((a.correctAnswers as string[]) ?? []); const chosen=new Set<string>();
    raw.forEach((item,i)=>{ const id=typeof item==='string'?item:item.id; const label=typeof item==='string'?item:(item.text??item.id); const b=this.button(280+(i%2)*400,220+Math.floor(i/2)*58,label,()=>{chosen.has(id)?chosen.delete(id):chosen.add(id); b.setFillStyle(chosen.has(id)?0xd9edc8:0xffffff,.92);},330); });
    this.button(480,500,'CONFIRMAR',()=>this.submit(chosen.size===correct.size && [...chosen].every(v=>correct.has(v))),240);
  }

  private renderAssembly(a: BaseActivity) {
    this.content.add(this.add.text(480,255,'Área de composição geométrica',{fontFamily:'Arial',fontSize:'22px',color:'#263b25'}).setOrigin(.5));
    this.content.add(this.add.rectangle(480,360,520,180,0xffffff,.3).setStrokeStyle(3,0x52734d));
    this.button(480,485,'VALIDAR COMPOSIÇÃO',()=>this.submit(true),280);
  }

  private renderUnsupported(a: BaseActivity) { this.feedbackText.setText(`Tipo ainda não implementado: ${a.type}`); }

  private finishMission() {
    this.content.removeAll(true);
    const score=this.activities.addCompletionBonus(); this.scoreText.setText(`Pontos: ${score}`); this.progressText.setText('Missão concluída');
    this.content.add(this.add.text(480,245,'🏅 MISSÃO CONCLUÍDA',{fontFamily:'Arial',fontSize:'38px',color:'#263b25',fontStyle:'bold'}).setOrigin(.5));
    this.content.add(this.add.text(480,315,`Bônus de conclusão: +${this.activities.completionBonus()}\nPontuação final: ${score}`,{fontFamily:'Arial',fontSize:'24px',color:'#263b25',align:'center'}).setOrigin(.5));
  }
}
