-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "perfil" VARCHAR(20) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "cnpj" VARCHAR(14) NOT NULL,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filial" (
    "id_cliente" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,

    CONSTRAINT "filial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obrigacao" (
    "id" SERIAL NOT NULL,
    "descricao" VARCHAR(150) NOT NULL,
    "prazo" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pendente',
    "id_cliente" INTEGER NOT NULL,
    "id_filial" INTEGER,

    CONSTRAINT "obrigacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_cnpj_key" ON "cliente"("cnpj");

-- AddForeignKey
ALTER TABLE "filial" ADD CONSTRAINT "filial_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obrigacao" ADD CONSTRAINT "obrigacao_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obrigacao" ADD CONSTRAINT "obrigacao_id_filial_fkey" FOREIGN KEY ("id_filial") REFERENCES "filial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
