
export class WordTracker {
  constructor(options) {
    if (!options) options = {};
    this.numberOfMostFrequentWords = options.numberOfMostFrequentWords || 3;
    this.bannedWords = options.bannedWords || [];

    this.countmap = {};
    this.mostFrequentWords = [];
  }

  track(words) {
    for (var i = 0; i < words.length; i++) {
      var word = words[i].replace(/\s/g, '').toLowerCase();
      if (word.length === 0 || this.bannedWords.indexOf(word) >= 0) {
        continue;
      }

      var count = this.countmap[word] || 0;
      count += 1;
      this.countmap[word] = count;

      for (var j = 0; j < this.numberOfMostFrequentWords; j++) {
        var frequentWord = this.mostFrequentWords[j];
        var frequentWordCount = this.countmap[frequentWord] || 0;
        if (count > frequentWordCount) {
          // this becomes a frequent word
          var currentIndex = this.mostFrequentWords.indexOf(word);
          if (currentIndex >= 0) {
            // already in list, swap
            this.mostFrequentWords[currentIndex] = frequentWord;
            this.mostFrequentWords[j] = word;
          }
          else {
            // insert into list
            this.mostFrequentWords.splice(j, 0, word);
            if (this.mostFrequentWords.length > this.numberOfMostFrequentWords) {
              this.mostFrequentWords.pop();
            }
          }

          break; // get out
        }
      }
    }
  }

  mostFrequentWordsList() {
    return this.mostFrequentWords.join(', ');
  }

}
