FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/

RUN npm install --workspaces

COPY packages/database ./packages/database
COPY apps/api ./apps/api
COPY tsconfig.base.json ./

RUN npm run build --workspace @erp/database
RUN npm run build --workspace @erp/api

EXPOSE 3001

CMD ["node", "dist/apps/api/src/main.js"]
