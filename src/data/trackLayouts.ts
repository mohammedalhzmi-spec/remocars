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
  city_ring: {
    points: [[-68, -35], [-54, -64], [-8, -58], [14, -40], [57, -54], [72, -20], [55, 2], [70, 34], [34, 59], [5, 40], [-29, 61], [-65, 39], [-74, 2]],
    width: 17, road: 0x303b49, line: 0x67e8f9, sky: 0x516980, fog: 0x3c5064, fogDensity: 0.0037, ground: 0x333c43,
    decoration: 'cones', decorationColor: 0x38bdf8,
  },
  desert_canyon: {
    points: [[-74, -26], [-64, -60], [-33, -48], [-8, -30], [24, -51], [61, -58], [78, -23], [52, 1], [70, 35], [38, 61], [5, 39], [-29, 60], [-64, 43], [-80, 12]],
    width: 16, road: 0x5a4a3e, line: 0xfcd34d, sky: 0xd8a16c, fog: 0xa97951, fogDensity: 0.0029, ground: 0x94663f,
    decoration: 'cones', decorationColor: 0xb47b45,
  },
  forest_rally: {
    points: [[-70, -33], [-46, -63], [-15, -45], [12, -61], [51, -51], [73, -17], [49, 6], [64, 44], [28, 63], [-6, 42], [-43, 57], [-73, 21]],
    width: 14, road: 0x454a40, line: 0xd9d3a5, sky: 0x91aa96, fog: 0x64796c, fogDensity: 0.0038, ground: 0x214832,
    decoration: 'trees', decorationColor: 0x1d6638,
  },
  volcano_night: {
    points: [[-72, -34], [-49, -61], [-13, -46], [12, -65], [46, -52], [72, -22], [48, 1], [68, 37], [35, 62], [4, 41], [-31, 60], [-69, 37], [-77, 6]],
    width: 15, road: 0x332f35, line: 0xff8561, sky: 0x171a2c, fog: 0x3a2931, fogDensity: 0.0044, ground: 0x291f22,
    decoration: 'cones', decorationColor: 0xf9735b,
  },
  desert_stunt_dunes: {
    points: [[-78, -24], [-62, -58], [-31, -42], [-4, -64], [31, -50], [69, -55], [82, -17], [55, 9], [71, 43], [34, 65], [2, 40], [-34, 62], [-69, 40], [-84, 7]],
    width: 18, road: 0x66503a, line: 0xfde68a, sky: 0xe9b96e, fog: 0xc8965f, fogDensity: 0.0028, ground: 0xa87945,
    decoration: 'cones', decorationColor: 0xd19a54,
  },
  city_sky_bridge: {
    points: [[-72, -34], [-51, -65], [-7, -60], [20, -40], [58, -57], [77, -21], [52, 2], [73, 36], [39, 62], [7, 43], [-28, 64], [-67, 39], [-79, 2]],
    width: 17, road: 0x344454, line: 0x67e8f9, sky: 0x6d8da1, fog: 0x40576b, fogDensity: 0.0038, ground: 0x38434b,
    decoration: 'cones', decorationColor: 0x38bdf8,
  },
  canyon_stunt_circuit: {
    points: [[-82, -27], [-66, -63], [-38, -47], [-12, -26], [16, -55], [53, -63], [81, -31], [57, -4], [76, 30], [45, 61], [8, 43], [-24, 65], [-63, 47], [-86, 11]],
    width: 19, road: 0x5a493b, line: 0xfb923c, sky: 0xd49a6d, fog: 0x997052, fogDensity: 0.0031, ground: 0x8a6041,
    decoration: 'cones', decorationColor: 0xc88750,
  },
  neon_stadium_loop: {
    points: [[-68, -37], [-50, -64], [-9, -58], [19, -43], [56, -57], [75, -25], [54, 0], [72, 31], [43, 57], [7, 44], [-25, 61], [-62, 39], [-77, 4]],
    width: 20, road: 0x29263f, line: 0xf0abfc, sky: 0x1c1739, fog: 0x382448, fogDensity: 0.0048, ground: 0x211b31,
    decoration: 'cones', decorationColor: 0xe879f9,
  },
  mp_stunt_ridge: {
    points: [[-78, -31], [-52, -62], [-20, -45], [9, -67], [45, -52], [75, -27], [55, 0], [75, 35], [42, 63], [8, 41], [-27, 67], [-65, 46], [-82, 9]],
    width: 16, road: 0x536271, line: 0xf0f9ff, sky: 0xb7d3ec, fog: 0x9aacbf, fogDensity: 0.0043, ground: 0xb9c8d0,
    decoration: 'cones', decorationColor: 0xeff6ff,
  },
};

export function getTrackLayout(trackId: string): TrackLayout {
  return layouts[trackId] ?? layouts.coastal_highway;
}
