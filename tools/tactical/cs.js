// pré-carrega os ajustes de teste antes do motor (usado pelo influencia.ts)
if (process.env.CS) globalThis.__COUNTER_SCALE__ = Number(process.env.CS);
if (process.env.FORM != null) globalThis.__FORMATION__ = Number(process.env.FORM);
if (process.env.TACWIN != null) globalThis.__TACWIN__ = Number(process.env.TACWIN);
if (process.env.TACMAX != null) globalThis.__TACMAX__ = Number(process.env.TACMAX);
