
var secrets = require('./secrets');
var Twit = require('twit');
var socketPort = process.env.GOD_SOCKET_PORT || 6001;

var tweetStore = [];

var io = require('socket.io')(socketPort);
io.on('connection', function(socket) {
  console.log('got a new client...');

  socket.on('disconnect', function() {
    console.log('lost a client...');
  });
});

var twitterClient = new Twit({
  consumer_key: secrets.CONSUMER_KEY,
  consumer_secret: secrets.CONSUMER_SECRET,
  access_token: secrets.ACCESS_TOKEN,
  access_token_secret: secrets.ACCESS_TOKEN_SECRET
});

var godStream = twitterClient.stream('statuses/filter', {
  track: ['god', 'jesus']
});

godStream.on('tweet', function(tweet) {
  var compressedTweet = compressTweet(tweet);
  console.log(compressedTweet);

  tweetStore.push(tweet);
  if (tweetStore.length > 100) {
    tweetStore.unshift();
  }

  // send the tweet to all connected socket.io clients
  io.emit('fresh-tweet', compressedTweet);
});

console.log('all set up and ready to go...');

function compressTweet(tweet) {
  return {
    text: tweet.text
  };
}
