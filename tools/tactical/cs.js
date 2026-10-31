// pré-carrega os ajustes de teste antes do motor (usado pelo influencia.ts)
if (process.env.CS) globalThis.__COUNTER_SCALE__ = Number(process.env.CS);
if (process.env.FORM != null) globalThis.__FORMATION__ = Number(process.env.FORM);
if (process.env.TACWIN != null) globalThis.__TACWIN__ = Number(process.env.TACWIN);
if (process.env.TACMAX != null) globalThis.__TACMAX__ = Number(process.env.TACMAX);
if (process.env.DAIR != null) globalThis.__DAIR__ = Number(process.env.DAIR);
if (process.env.DAIRF != null) globalThis.__DAIRF__ = Number(process.env.DAIRF);
if (process.env.DOUT != null) globalThis.__DOUT__ = Number(process.env.DOUT);
if (process.env.DIN != null) globalThis.__DIN__ = Number(process.env.DIN);
if (process.env.EDGE != null) globalThis.__EDGE__ = Number(process.env.EDGE);
if (process.env.WALL != null) globalThis.__WALL__ = Number(process.env.WALL);
if (process.env.GATE != null) globalThis.__GATE__ = Number(process.env.GATE);
