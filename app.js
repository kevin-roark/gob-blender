
var secrets = require('./secrets');
var Twit = require('twit');
var sentiment = require('sentiment');
var request = require('superagent');
var xml2js = require('xml2js');

var tweetStore = [];

var socketPort = process.env.GOD_SOCKET_PORT || 6001;
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
  track: ['god', 'jesus'],
  language: 'en'
});

godStream.on('tweet', function(tweet) {
  // compress
  var compressedTweet = compressTweet(tweet);

  // sentiment analysis
  sentiment(compressedTweet.text, function (err, result) {
    var score = result ? result.score : 0;
    var tweetData = {
      tweet: compressedTweet,
      sentiment: score
    };

    // add to local tweet store
    tweetStore.push(tweetData);
    if (tweetStore.length > 100) {
      tweetStore.unshift();
    }

    // send the data to all connected socket.io clients
    io.emit('fresh-tweet', tweetData);
  });
});

var bibleInterval = setInterval(function() {
  if (tweetStore.length === 0) {
    return;
  }

  return;

  var tweetData = tweetStore[tweetStore.length - 1];
  searchBible(tweetData.tweet.text);
}, 5000);

console.log('all set up and ready to go...');

function compressTweet(tweet) {
  return {
    text: tweet.text
  };
}

function searchBible(query) {
  console.log('searching bible for: ' + query);
  request
    .get('https://bibles.org/v2/search.xml')
    .auth(secrets.BIBLE_SECRET_KEY, 'X')
    .redirects(10)
    .query({query: query, limit: 3})
    .end(function(err, res) {
      console.log('got it back...');

      if (err) {
        console.log(err);
        return;
      }

      xml2js.parseString(res.text, function(err, result) {
        if (result) {
          console.log(JSON.stringify(result));
        }
      });
    });
}
