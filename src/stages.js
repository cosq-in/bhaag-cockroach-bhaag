export const STAGES = [
  {
    id: 1,
    name: 'Paper Leak',
    boss: 'Exam Hall',
    length: 2400,
    bossStart: 2000,
    bossLen: 400,
    palette: {
      sky: ['#f6c27a', '#d9823a'], sun: '#ffe2a8', building: '#b8714a',
      ground: '#a8613a', road: '#4a4545', edge: '#f4d35e',
    },
    hazards: {
      low: ['barricade', 'rubble'],
      high: ['banner'],
      block: ['van', 'auto', 'auto', 'standee'],
      gas: ['tear gas'],
      crowd: ['protester'],
      bus: ['bus', 'metro'],
      ramp: ['ramp'],
    },
    slogans: [
      'Resign already, I have to leave for Panvel tomorrow',
      'Paper leak hua, future leak mat karo',
      'Cockroaches never quit',
      'Chai piyo, sawal pucho',
      'Exam hall se aaya hu, ghar jaane do',
    ],
  },
  {
    id: 2,
    name: 'Voter Roll',
    boss: 'Election Bhawan',
    length: Infinity,
    bossStart: 1500,
    bossLen: 500,
    palette: {
      sky: ['#5b6bbf', '#2a1f4d'], sun: '#cfd8ff', building: '#1d1535',
      ground: '#251c3a', road: '#3a3350', edge: '#9bb1ff',
    },
    hazards: {
      low: ['barricade', 'metro gate'],
      high: ['banner'],
      block: ['van', 'water cannon', 'SIR form', 'standee'],
      gas: ['tear gas'],
      crowd: ['protester'],
      bus: ['bus', 'metro'],
      ramp: ['ramp'],
    },
    slogans: [
      'Name kata? Check kar',
      'Voter list mein hu ya nahi?',
      'SIR, ye form kaun bharega?',
      'Lockdown se lock nahi hoga sawal',
      'Ginti poori, awaaz poori',
    ],
  },
];

export function locate(distance) {
  let start = 0;
  for (let i = 0; i < STAGES.length; i++) {
    const stage = STAGES[i];
    const end = start + stage.length;
    if (distance < end || i === STAGES.length - 1) {
      const local = distance - start;
      return { stage, local, boss: local >= stage.bossStart && local < stage.bossStart + stage.bossLen };
    }
    start = end;
  }
}
