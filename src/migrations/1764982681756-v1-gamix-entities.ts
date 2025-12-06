import { MigrationInterface, QueryRunner } from 'typeorm';

export class V1GamixEntities1764982681756 implements MigrationInterface {
  name = 'V1GamixEntities1764982681756';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idea_id" uuid, "comment_id" uuid, "profile_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_cd153ebb5e4d3954e30b2c07203" UNIQUE ("profile_id", "comment_id"), CONSTRAINT "UQ_10ef3316459b9e5f56600b55fb1" UNIQUE ("profile_id", "idea_id"), CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a1d1bf4177449718b0f4862d5" ON "likes" ("idea_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7cbd1e9a5c85ffab0611ec5f0a" ON "likes" ("comment_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_836753e68ed9d1de2d0a340467" ON "likes" ("profile_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" character varying(200) NOT NULL, "idea_id" uuid NOT NULL, "parent_comment_id" uuid, "author_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ae79ee0b70da15c00c55a06c28" ON "comments" ("idea_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_93ce08bdbea73c0c7ee673ec35" ON "comments" ("parent_comment_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e6d38899c31997c45d128a8973" ON "comments" ("author_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "views" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idea_id" uuid NOT NULL, "profile_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c51c90e55d28deb2c08ed4d5aff" UNIQUE ("profile_id", "idea_id"), CONSTRAINT "PK_ae7537f375649a618fff0fb2cb6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_975bf224855aebc192446944a4" ON "views" ("idea_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aade245981a2df5a7f13d0aed1" ON "views" ("profile_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(50) NOT NULL, "idea_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_06579be232aea9b7667d2c6705" ON "tags" ("idea_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ideas_status_enum" AS ENUM('Closed', 'Open', 'Canceled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ideas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(70) NOT NULL, "content" character varying(700) NOT NULL, "author_id" uuid NOT NULL, "status" "public"."ideas_status_enum" NOT NULL DEFAULT 'Open', "project_id" uuid, "links" jsonb NOT NULL DEFAULT '[]', "images" jsonb NOT NULL DEFAULT '[]', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6ab43f1e9b1cef0d8f3e56ce3a3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_87e0014ad0cca8cfee604dfbcd" ON "ideas" ("author_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f3016f7d9929a2e132d99eff16" ON "ideas" ("project_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."collaboration_requests_status_enum" AS ENUM('Pending', 'Approved', 'Rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "collaboration_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idea_id" uuid NOT NULL, "requester_id" uuid NOT NULL, "chat_id" uuid, "status" "public"."collaboration_requests_status_enum" NOT NULL DEFAULT 'Pending', "feedback" character varying, "message" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_01d632a61465c6dd4d01f94649" UNIQUE ("chat_id"), CONSTRAINT "PK_69423d23da1c2565fbb05da873d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "messages" jsonb NOT NULL DEFAULT '[]', "owner_id" uuid, "idea_id" uuid, "collaboration_request_id" uuid, "project_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_53cef0353b3074c55460d747b2" UNIQUE ("collaboration_request_id"), CONSTRAINT "REL_fe2057e1634447718cc9a0ff8a" UNIQUE ("project_id"), CONSTRAINT "PK_0117647b3c4a4e5ff198aeb6206" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fe2057e1634447718cc9a0ff8a" ON "chats" ("project_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "project" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(100) NOT NULL DEFAULT 'Default title', "description" character varying(300) NOT NULL DEFAULT 'Default description', "icon" character varying(2048), "background_image" character varying(2048), "owner_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "chat_id" uuid, CONSTRAINT "REL_3e6297b30e863426cd2ae21301" UNIQUE ("chat_id"), CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d40afe32d1d771bea7a5f46818" ON "project" ("owner_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "follows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "follower_user_id" uuid NOT NULL, "following_user_id" uuid, "following_project_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7e84dc4e994a9439258bc64700e" UNIQUE ("follower_user_id", "following_user_id"), CONSTRAINT "PK_8988f607744e16ff79da3b8a627" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "display_name" character varying(300) NOT NULL, "icon" character varying(2048), "autobiography" character varying(500), "background_image" character varying(2048), "links" jsonb NOT NULL DEFAULT '[]', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."oauth_provider_enum" AS ENUM('Google', 'Github', 'LinkedIn')`,
    );
    await queryRunner.query(
      `CREATE TABLE "oauth" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" "public"."oauth_provider_enum" NOT NULL, "email" character varying NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_82c14a2b59215320a6df2206a5c" UNIQUE ("email"), CONSTRAINT "UQ_3eba4e91e8076d221908a38263b" UNIQUE ("provider", "email"), CONSTRAINT "PK_a957b894e50eb16b969c0640a8d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c1e31b84cedaa9135fd13ca162" ON "oauth" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying(50) NOT NULL, "email" character varying(320) NOT NULL, "password" character varying(60) NOT NULL, "verified" boolean NOT NULL DEFAULT false, "code" character varying(6), "profile_id" uuid NOT NULL, "refresh_token" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_23371445bd80cb3e413089551bf" UNIQUE ("profile_id"), CONSTRAINT "UQ_5230070094e8135a3d763d90e75" UNIQUE ("refresh_token"), CONSTRAINT "REL_23371445bd80cb3e413089551b" UNIQUE ("profile_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('Invite', 'Comment', 'Like', 'Follow')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_related_entity_type_enum" AS ENUM('COLLABORATION_REQUEST', 'IDEA', 'COMMENT', 'PROJECT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_profile_id" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying(100) NOT NULL, "message" character varying(300) NOT NULL, "read_at" TIMESTAMP, "actor_profile_id" uuid, "related_entity_id" character varying, "related_entity_type" "public"."notifications_related_entity_type_enum", "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0d0c9fc563eb3cb34f801c13f7" ON "notifications" ("user_profile_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "chat_members" ("chat_id" uuid NOT NULL, "profile_id" uuid NOT NULL, CONSTRAINT "PK_32276ef9f7b00885161a7a124eb" PRIMARY KEY ("chat_id", "profile_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_29ffb4b6edf59a786212976533" ON "chat_members" ("chat_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1fc7e820e487fa58564769d357" ON "chat_members" ("profile_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "project_members" ("project_id" uuid NOT NULL, "profile_id" uuid NOT NULL, CONSTRAINT "PK_e3b2ca7d28152830de28f2d8c2f" PRIMARY KEY ("project_id", "profile_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b5729113570c20c7e214cf3f58" ON "project_members" ("project_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8876b9f02a3cb0f28ed0710e90" ON "project_members" ("profile_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "likes" ADD CONSTRAINT "FK_9a1d1bf4177449718b0f4862d53" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes" ADD CONSTRAINT "FK_7cbd1e9a5c85ffab0611ec5f0ac" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes" ADD CONSTRAINT "FK_836753e68ed9d1de2d0a3404674" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_ae79ee0b70da15c00c55a06c28e" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_93ce08bdbea73c0c7ee673ec35a" FOREIGN KEY ("parent_comment_id") REFERENCES "comments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_e6d38899c31997c45d128a8973b" FOREIGN KEY ("author_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "views" ADD CONSTRAINT "FK_975bf224855aebc192446944a48" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "views" ADD CONSTRAINT "FK_aade245981a2df5a7f13d0aed18" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" ADD CONSTRAINT "FK_06579be232aea9b7667d2c6705f" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ideas" ADD CONSTRAINT "FK_87e0014ad0cca8cfee604dfbcd4" FOREIGN KEY ("author_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ideas" ADD CONSTRAINT "FK_f3016f7d9929a2e132d99eff162" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaboration_requests" ADD CONSTRAINT "FK_156972c179e4f3c9c2ff84b0f69" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaboration_requests" ADD CONSTRAINT "FK_57d2a91864096e9181b28c8241f" FOREIGN KEY ("requester_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaboration_requests" ADD CONSTRAINT "FK_01d632a61465c6dd4d01f94649d" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "FK_fe259bf83d8aac1091be2fac967" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "FK_33703cd7ca5571c9cbb0f0241f1" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "FK_53cef0353b3074c55460d747b24" FOREIGN KEY ("collaboration_request_id") REFERENCES "collaboration_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "FK_fe2057e1634447718cc9a0ff8ae" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD CONSTRAINT "FK_d40afe32d1d771bea7a5f468185" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD CONSTRAINT "FK_3e6297b30e863426cd2ae21301b" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" ADD CONSTRAINT "FK_9c3525df310a19926ca33b0da83" FOREIGN KEY ("follower_user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" ADD CONSTRAINT "FK_afe636fd5d9cf912133e7eb7aeb" FOREIGN KEY ("following_user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" ADD CONSTRAINT "FK_12e21a1635ef74c1fae834b916e" FOREIGN KEY ("following_project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth" ADD CONSTRAINT "FK_c1e31b84cedaa9135fd13ca1620" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_23371445bd80cb3e413089551bf" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_0d0c9fc563eb3cb34f801c13f7c" FOREIGN KEY ("user_profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_41f09a514fa3b188b6aafc587f6" FOREIGN KEY ("actor_profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_members" ADD CONSTRAINT "FK_29ffb4b6edf59a7862129765339" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_members" ADD CONSTRAINT "FK_1fc7e820e487fa58564769d357b" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ADD CONSTRAINT "FK_b5729113570c20c7e214cf3f58d" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ADD CONSTRAINT "FK_8876b9f02a3cb0f28ed0710e900" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_members" DROP CONSTRAINT "FK_8876b9f02a3cb0f28ed0710e900"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" DROP CONSTRAINT "FK_b5729113570c20c7e214cf3f58d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_members" DROP CONSTRAINT "FK_1fc7e820e487fa58564769d357b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_members" DROP CONSTRAINT "FK_29ffb4b6edf59a7862129765339"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_41f09a514fa3b188b6aafc587f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_0d0c9fc563eb3cb34f801c13f7c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_23371445bd80cb3e413089551bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth" DROP CONSTRAINT "FK_c1e31b84cedaa9135fd13ca1620"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_12e21a1635ef74c1fae834b916e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_afe636fd5d9cf912133e7eb7aeb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_9c3525df310a19926ca33b0da83"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" DROP CONSTRAINT "FK_3e6297b30e863426cd2ae21301b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" DROP CONSTRAINT "FK_d40afe32d1d771bea7a5f468185"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" DROP CONSTRAINT "FK_fe2057e1634447718cc9a0ff8ae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" DROP CONSTRAINT "FK_53cef0353b3074c55460d747b24"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" DROP CONSTRAINT "FK_33703cd7ca5571c9cbb0f0241f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" DROP CONSTRAINT "FK_fe259bf83d8aac1091be2fac967"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaboration_requests" DROP CONSTRAINT "FK_01d632a61465c6dd4d01f94649d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaboration_requests" DROP CONSTRAINT "FK_57d2a91864096e9181b28c8241f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaboration_requests" DROP CONSTRAINT "FK_156972c179e4f3c9c2ff84b0f69"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ideas" DROP CONSTRAINT "FK_f3016f7d9929a2e132d99eff162"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ideas" DROP CONSTRAINT "FK_87e0014ad0cca8cfee604dfbcd4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" DROP CONSTRAINT "FK_06579be232aea9b7667d2c6705f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "views" DROP CONSTRAINT "FK_aade245981a2df5a7f13d0aed18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "views" DROP CONSTRAINT "FK_975bf224855aebc192446944a48"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_e6d38899c31997c45d128a8973b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_93ce08bdbea73c0c7ee673ec35a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_ae79ee0b70da15c00c55a06c28e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes" DROP CONSTRAINT "FK_836753e68ed9d1de2d0a3404674"`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes" DROP CONSTRAINT "FK_7cbd1e9a5c85ffab0611ec5f0ac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes" DROP CONSTRAINT "FK_9a1d1bf4177449718b0f4862d53"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8876b9f02a3cb0f28ed0710e90"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b5729113570c20c7e214cf3f58"`,
    );
    await queryRunner.query(`DROP TABLE "project_members"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1fc7e820e487fa58564769d357"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_29ffb4b6edf59a786212976533"`,
    );
    await queryRunner.query(`DROP TABLE "chat_members"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0d0c9fc563eb3cb34f801c13f7"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(
      `DROP TYPE "public"."notifications_related_entity_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c1e31b84cedaa9135fd13ca162"`,
    );
    await queryRunner.query(`DROP TABLE "oauth"`);
    await queryRunner.query(`DROP TYPE "public"."oauth_provider_enum"`);
    await queryRunner.query(`DROP TABLE "profiles"`);
    await queryRunner.query(`DROP TABLE "follows"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d40afe32d1d771bea7a5f46818"`,
    );
    await queryRunner.query(`DROP TABLE "project"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fe2057e1634447718cc9a0ff8a"`,
    );
    await queryRunner.query(`DROP TABLE "chats"`);
    await queryRunner.query(`DROP TABLE "collaboration_requests"`);
    await queryRunner.query(
      `DROP TYPE "public"."collaboration_requests_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f3016f7d9929a2e132d99eff16"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_87e0014ad0cca8cfee604dfbcd"`,
    );
    await queryRunner.query(`DROP TABLE "ideas"`);
    await queryRunner.query(`DROP TYPE "public"."ideas_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_06579be232aea9b7667d2c6705"`,
    );
    await queryRunner.query(`DROP TABLE "tags"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aade245981a2df5a7f13d0aed1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_975bf224855aebc192446944a4"`,
    );
    await queryRunner.query(`DROP TABLE "views"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e6d38899c31997c45d128a8973"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_93ce08bdbea73c0c7ee673ec35"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ae79ee0b70da15c00c55a06c28"`,
    );
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_836753e68ed9d1de2d0a340467"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7cbd1e9a5c85ffab0611ec5f0a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9a1d1bf4177449718b0f4862d5"`,
    );
    await queryRunner.query(`DROP TABLE "likes"`);
  }
}
