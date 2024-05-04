const MAX_PLAYERS_PER_LOBBY = 10;
const MIN_PLAYERS_PER_LOBBY = 2;
const TIME_PER_QUESTION = 30; //seconds
const LAG_BIAS = 3; //seconds
const DEFAUL_PLAYER_NAME = "Player";
const REPORT_DISPLAY_TIME = 10;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
//export the constants

module.exports = {
  MAX_PLAYERS_PER_LOBBY: MAX_PLAYERS_PER_LOBBY,
  MIN_PLAYERS_PER_LOBBY: MIN_PLAYERS_PER_LOBBY,
  TIME_PER_QUESTION: TIME_PER_QUESTION,
  LAG_BIAS: LAG_BIAS,
  DEFAUL_PLAYER_NAME: DEFAUL_PLAYER_NAME,
  REPORT_DISPLAY_TIME: REPORT_DISPLAY_TIME,
  supabaseUrl: supabaseUrl,
  supabaseKey: supabaseKey,
};
