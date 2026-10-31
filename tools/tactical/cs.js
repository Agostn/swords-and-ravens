// pré-carrega os ajustes de teste antes do motor (usado pelo influencia.ts)
if (process.env.CS) globalThis.__COUNTER_SCALE__ = Number(process.env.CS);
