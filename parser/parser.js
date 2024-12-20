// parser/parser.js
const { CstParser } = require('chevrotain');
const { IsokineLexer, allTokens } = require('./lexer');

class IsokineParser extends CstParser {
  constructor() {
    super(allTokens);

    this.RULE("file", () => {
      this.MANY(() => this.SUBRULE(this.line));
    });

    this.RULE("line", () => {
      // Each line may have zero or one recognized tokens, rest falls into AnyText
      this.MANY(() => {
        this.OR([
          { ALT: () => this.CONSUME(EssenceGlyph) },
          { ALT: () => this.CONSUME(EssenceToken) },
          { ALT: () => this.CONSUME(SpeakAtPort) },
          { ALT: () => this.CONSUME(Whisper) },
          { ALT: () => this.CONSUME(PathDef) },
          { ALT: () => this.CONSUME(ConnectDB) },
          { ALT: () => this.CONSUME(UseCollection) },
          { ALT: () => this.CONSUME(WhenAskedFor) },
          { ALT: () => this.CONSUME(WhenPostedTo) },
          { ALT: () => this.CONSUME(AnyText) }
        ]);
      });
    });

    this.performSelfAnalysis();
  }
}

module.exports = IsokineParser;
