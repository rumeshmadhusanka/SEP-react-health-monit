class Health{
    url;
    constructor() {
        this.url = "http://localhost:5000/health"
    }

    async getData(){
        let x = await fetch(this.url);
        return await x.json();
    }
}

module.exports = Health;