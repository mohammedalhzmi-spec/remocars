export interface TrackLayout {
  points: [number, number][];
  width: number;
  road: number;
  line: number;
  sky: number;
  fog: number;
  fogDensity: number;
  ground: number;
  decoration: 'trees' | 'cones';
  decorationColor: number;
}

const layouts: Record<string, TrackLayout> = {
  coastal_highway: {
    points: [[-58, -28], [-32, -62], [24, -64], [66, -38], [78, 2], [66, 42], [28, 62], [-26, 61], [-66, 38], [-78, 0]],
    width: 17, road: 0x34434a, line: 0x67e8f9, sky: 0x8bb5ca, fog: 0x5d8694, fogDensity: 0.0026, ground: 0x1d514b,
    decoration: 'cones', decorationColor: 0x38bdf8,
  },
  river_valley: {
    points: [[-68, -30], [-51, -58], [-12, -49], [22, -66], [59, -40], [70, -5], [48, 20], [54, 55], [15, 62], [-11, 38], [-48, 52], [-69, 20]],
    width: 16, road: 0x48514c, line: 0xa3e635, sky: 0x94b4a3, fog: 0x7e9c83, fogDensity: 0.0035, ground: 0x28533b,
    decoration: 'trees', decorationColor: 0x237245,
  },
  snowy_pass: {
    points: [[-65, -34], [-45, -59], [-4, -55], [25, -38], [65, -46], [72, -7], [45, 11], [57, 45], [18, 60], [-14, 38], [-56, 47], [-72, 7]],
    width: 14, road: 0x55616c, line: 0xe0f2fe, sky: 0xb6c9dc, fog: 0x9eafc3, fogDensity: 0.0048, ground: 0xcbd5e1,
    decoration: 'cones', decorationColor: 0xeff6ff,
  },
  drift_arena: {
    points: [[-48, -35], [-24, -63], [21, -65], [55, -46], [64, -13], [50, 17], [64, 44], [31, 63], [-8, 56], [-47, 62], [-65, 35], [-55, 5], [-69, -17]],
    width: 22, road: 0x332c43, line: 0xf472b6, sky: 0x24142e, fog: 0x392342, fogDensity: 0.005, ground: 0x191321,
    decoration: 'cones', decorationColor: 0xf472b6,
  },
  mp_desert_canyon: {
    points: [[-73, -25], [-61, -58], [-26, -49], [-3, -30], [30, -42], [66, -53], [78, -17], [51, 3], [64, 39], [32, 59], [7, 36], [-26, 57], [-63, 42], [-78, 11]],
    width: 18, road: 0x66503a, line: 0xfbbf24, sky: 0xf0b56a, fog: 0xc89561, fogDensity: 0.0028, ground: 0xa87945,
    decoration: 'cones', decorationColor: 0xd19a54,
  },
  mp_neon_docks: {
    points: [[-70, -46], [-27, -49], [-4, -26], [44, -46], [73, -19], [47, 4], [73, 33], [42, 56], [10, 34], [-20, 58], [-65, 42], [-42, 10]],
    width: 16, road: 0x263544, line: 0x22d3ee, sky: 0x111b33, fog: 0x162b43, fogDensity: 0.0042, ground: 0x172230,
    decoration: 'cones', decorationColor: 0x22d3ee,
  },
  mp_forest_sprint: {
    points: [[-69, -33], [-45, -62], [-13, -42], [10, -60], [49, -49], [71, -18], [49, 2], [63, 42], [25, 62], [-6, 41], [-43, 56], [-71, 21]],
    width: 15, road: 0x3e4a41, line: 0x86efac, sky: 0x9fc5a8, fog: 0x6b8e74, fogDensity: 0.0034, ground: 0x1c4531,
    decoration: 'trees', decorationColor: 0x185b38,
  },
  mp_mountain_pass: {
    points: [[-76, -31], [-51, -57], [-24, -41], [2, -64], [36, -48], [67, -58], [80, -18], [54, 7], [71, 40], [36, 56], [9, 36], [-23, 63], [-58, 47], [-77, 12]],
    width: 14, road: 0x526171, line: 0xdbeafe, sky: 0xb7d3ec, fog: 0xa0b4ca, fogDensity: 0.0045, ground: 0xcbd5e1,
    decoration: 'cones', decorationColor: 0xf1f5f9,
  },
};

export function getTrackLayout(trackId: string): TrackLayout {
  return layouts[trackId] ?? layouts.coastal_highway;
}
