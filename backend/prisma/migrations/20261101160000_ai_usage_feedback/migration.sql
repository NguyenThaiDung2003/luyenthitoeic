-- CreateTable
CREATE TABLE "ai_usage" (
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("user_id","date")
);

-- CreateTable
CREATE TABLE "ai_explanation_feedback" (
    "explanation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "helpful" BOOLEAN NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ai_explanation_feedback_pkey" PRIMARY KEY ("explanation_id","user_id")
);

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_explanation_feedback" ADD CONSTRAINT "ai_explanation_feedback_explanation_id_fkey" FOREIGN KEY ("explanation_id") REFERENCES "ai_explanations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_explanation_feedback" ADD CONSTRAINT "ai_explanation_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
