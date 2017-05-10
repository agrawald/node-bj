class Player {
    constructor(that, _myId) {
        this.id = that.id;
        this.name = that.name;
        this.cards = [];
        for (let i = 0; i < that.cards.length; i++) {
            this.cards.push(new Card(that.cards[i]));
        }
        this.score = that.score;
        this.isBusted = that.isBusted;
        this.isMe = _myId === that.id;
        this.isDealer = that.isDealer;
    }

    render() {
        console.log(`... rendering player ${this.id}`);
        let playerTemplate = document.getElementById('playerTemplate').innerHTML;
        $('#players').append(Mustache.render(playerTemplate, this));
        this.display();
    }

    drawCards() {
        const canvas = document.getElementById(`${this.id}-canvas`);
        const ctx = canvas.getContext('2d');
        for (let i = 0; i < this.cards.length; i++) {
            ctx.drawImage(this.cards[i].img, i * 20, 0, 100, 150);
        }
    }

    display() {
        let loaded = 0;
        if (this.cards && this.cards.length > 0) {
            const _this = this;
            for (let i = 0; i < this.cards.length; i++) {
                this.cards[i].img.onload = function () {
                    if (++loaded === _this.cards.length) {
                        _this.drawCards();
                    }
                };
            }
        }
    }
}