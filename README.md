# GeoCurimataú — integração da Missão 1

Copie as pastas `src/` e `public/` para o projeto Phaser + TypeScript.

## Uso
Registre `Mission1Scene` no array `scene` da configuração Phaser e abra a cena com:

```ts
this.scene.start('Mission1Scene', { grade: 6 });
```

O JSON é carregado de `public/assets/activities/missao1-formas-caatinga.json`.

### Implementado
- interfaces TypeScript do banco;
- filtro de atividades por ano/dificuldade;
- pontuação e tentativas;
- feedback pedagógico;
- multiple-choice;
- drag-drop;
- drag-classification;
- select-object;
- select-multiple;
- base para assemble-shape;
- bônus de conclusão.

`assemble-shape` está com um validador provisório. Na versão visual definitiva, ele deve validar posição, rotação e geometria das peças.
