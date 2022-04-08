export default class MilUnit {
  constructor() {
    this.name = 'Unnamed Unit';
    this.sidc = {
      version: '10',
      context: '0',
      affiliation: '3',
      set: '10',
      status: '0',
      mod: '0',
      amplifier: '00',
      entity: '00',
      type: '00',
      subtype: '00',
      modifier1: '00',
      modifier2: '00',
    };
  }
  
  getSidcCode() {
    return Object.entries(this.sidc).map(([k, v]) => v).join('');
  }
  
  getSym() {
    return new ms.Symbol(this.getSidcCode(), {
      size: 48,
    }).asSVG()
  }
}
