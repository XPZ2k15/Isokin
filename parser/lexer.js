// parser/lexer.js
const { createToken, Lexer } = require('chevrotain');

// Define tokens
const EssenceToken = createToken({ name: "EssenceToken", pattern: /essence:\s*\w+/ });
const SpeakAtPort = createToken({ name: "SpeakAtPort", pattern: /speak at port \d+/ });
const Whisper = createToken({ name: "Whisper", pattern: /whisper:\s*.+/ });
const WhenAskedFor = createToken({ name: "WhenAskedFor", pattern: /when asked for / });
const WhenPostedTo = createToken({ name: "WhenPostedTo", pattern: /when posted to / });
const ConnectDB = createToken({ name: "ConnectDB", pattern: /connect to '[^']+'/ });
const UseCollection = createToken({ name: "UseCollection", pattern: /use collection '\w+'/ });
const PathDef = createToken({ name: "PathDef", pattern: /path:\s*\/[\w\/:]+/ });
const EssenceGlyph = createToken({ name: "EssenceGlyph", pattern: /◉|△|▢|✴/ });

// Whitespace and other tokens
const NewLine = createToken({ name: "NewLine", pattern: /\r?\n/, group: Lexer.SKIPPED });
const Space = createToken({ name: "Space", pattern: /[ \t]+/, group: Lexer.SKIPPED });
const Separator = createToken({ name: "Separator", pattern: /—/, group: Lexer.SKIPPED });

// AnyText as a fallback to capture the rest of the line
const AnyText = createToken({ name: "AnyText", pattern: /.+/, line_breaks: true });

// The order of tokens matters. Put AnyText last.
const allTokens = [
  NewLine, Space, Separator,
  EssenceGlyph, EssenceToken, SpeakAtPort, Whisper, ConnectDB, UseCollection, PathDef,
  WhenAskedFor, WhenPostedTo,
  AnyText
];

const IsokineLexer = new Lexer(allTokens);

module.exports = {
  IsokineLexer,
  allTokens
};
