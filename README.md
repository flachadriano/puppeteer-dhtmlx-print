# DHTMLX Gantt Chart print

## Setup

```
docker-compose up --build -d
```

## Run locally

Open terminal inside the project folder and run:
```sh
npm run start-ts
```

## Performance verificantion

This test was performed using and chart with 76000px x 27000px

Minimum width must be 1500px, because of the header spacing

With 1500px x 1000px print screen: 4585s / 76m
With 1500px x 1500px print screen: 3807s / 63m
With 2000px x 2000px print screen: 3004s / 50m
With 3000px x 3000px print screen: 1938s / 32m
With 4000px x 4000px print screen: 1780s / 29m
With 5000px x 5000px print screen: 1825s / 30m
