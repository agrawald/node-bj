class Card {
    constructor(that) {
        this.suit = that.suit;
        this.rank = that.rank;
        this.img = this.loadImage();
        this.isLoaded = false;
    }

    loadImage() {
        const img = new Image();
        img.src = `/img/${this.rank}${this.suit}.svg`;
        img.onload = this.loaded;
        return img;
    }

    loaded() {
        this.isLoaded = true;
    }
}