declare module "kuroshiro" {
  export default class Kuroshiro {
    static Util: { kanaToRomaji(input: string, system?: "nippon" | "passport" | "hepburn"): string };
    init(analyzer: unknown): Promise<void>;
  }
}

declare module "kuroshiro-analyzer-kuromoji" {
  export type KuromojiToken = {
    surface_form: string;
    pos: string;
    pos_detail_1: string;
    basic_form: string;
    reading?: string;
    pronunciation?: string;
  };

  export default class KuromojiAnalyzer {
    constructor(options?: { dictPath?: string });
    init(): Promise<void>;
    parse(input: string): Promise<KuromojiToken[]>;
  }
}
