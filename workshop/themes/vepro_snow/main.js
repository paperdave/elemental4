let snowflakes = [];

class Snowflake
{
    constructor(x, y, ySpeed, xAmp = 100)
    {
        this.x = x;
        this.y = y;
        this.ySpeed = ySpeed;
        this.xAmp = xAmp;
        this.xTimeOffset = random(0, 2 * PI);
        this.lifeTime = 0;
        this.size = floor(random(7, 10));
        this.rotation = random(0, 2 * PI);
        this.rotationSpeed = random(PI / 16, PI / 8);
        if(random(0, 1) < 0.5)
        {
            this.rotationSpeed *= -1;
        }
    }

    tick(dt)
    {
        this.lifeTime += dt;
        this.rotation += this.rotationSpeed * dt
        this.y += this.ySpeed * dt;
        this.x += cos(this.lifeTime * 1.5 + this.xTimeOffset) * this.xAmp * dt;
    }

    render()
    {
        stroke(220)
        for(let i = 0; i < 6; i++)
        {
            let a = 2 * PI / 6 * i + this.rotation;
            let r = this.size;
            let x = cos(a) * r, y = sin(a) * r;
            let x2 = cos(a - PI / 8) * r, y2 = sin(a - PI / 8) * r;
            let x3 = cos(a + PI / 8) * r, y3 = sin(a + PI / 8) * r;
            strokeWeight(2)
            line(this.x, this.y, this.x + x, this.y + y);
            strokeWeight(1)
            line(this.x + x * 0.5, this.y + y * 0.5, this.x + x2, this.y + y2);
            line(this.x + x * 0.5, this.y + y * 0.5, this.x + x3, this.y + y3);
        }
    }
}

function setup()
{
    background(21);
    noStroke();
    for(let i = 0; i < 60; i++)
    {
        snowflakes.push(new Snowflake(random(0, width), random(0, height), random(100, 150), random(50, 125)));
    }
}

function draw()
{
    let dt = getFrameRate() !== 0 ? 1 / getFrameRate() : 0;

    background(21);

    fill(220);
    for(let s of snowflakes)
    {
        s.tick(dt);
        s.render();

        if(s.y > height + s.size)
        {
            snowflakes = snowflakes.filter(sf => sf !== s);
            snowflakes.push(createNewSnowflake());
        }
    }
}

function createNewSnowflake()
{
    return new Snowflake(random(0, width), -15, random(100, 150), random(50, 125));
}