--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: fgc
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO fgc;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: fgc
--

COMMENT ON SCHEMA public IS '';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: PaymentEntityType; Type: TYPE; Schema: public; Owner: fgc
--

CREATE TYPE public."PaymentEntityType" AS ENUM (
    'ATHLETE_MEMBERSHIP',
    'CLUB_MEMBERSHIP',
    'EVENT_REGISTRATION',
    'CLUB_CHANGE',
    'ATHLETE_REGISTRATION'
);


ALTER TYPE public."PaymentEntityType" OWNER TO fgc;

--
-- Name: PaymentGateway; Type: TYPE; Schema: public; Owner: fgc
--

CREATE TYPE public."PaymentGateway" AS ENUM (
    'MERCADOPAGO',
    'PAGSEGURO',
    'ASAAS',
    'PAGHIPER',
    'INFINITPAY'
);


ALTER TYPE public."PaymentGateway" OWNER TO fgc;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: fgc
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BOLETO',
    'PIX'
);


ALTER TYPE public."PaymentMethod" OWNER TO fgc;

--
-- Name: PaymentProvider; Type: TYPE; Schema: public; Owner: fgc
--

CREATE TYPE public."PaymentProvider" AS ENUM (
    'MERCADOPAGO',
    'PAGSEGURO',
    'ASAAS',
    'PAGHIPER',
    'INFINITPAY'
);


ALTER TYPE public."PaymentProvider" OWNER TO fgc;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: fgc
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'PAID',
    'FAILED',
    'REFUNDED',
    'CANCELLED'
);


ALTER TYPE public."PaymentStatus" OWNER TO fgc;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public."Account" OWNER TO fgc;

--
-- Name: Athlete; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Athlete" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "fullName" text NOT NULL,
    cpf text NOT NULL,
    "birthDate" timestamp(3) without time zone NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    "zipCode" text NOT NULL,
    phone text NOT NULL,
    modalities text[],
    category text NOT NULL,
    "paymentStatus" text NOT NULL,
    "paymentId" text,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    email text,
    "cbcRegistration" text,
    "clubId" text,
    "isIndividual" boolean DEFAULT false,
    "registrationYear" integer DEFAULT EXTRACT(year FROM CURRENT_DATE),
    "isRenewal" boolean DEFAULT false,
    "firstRegistrationDate" timestamp with time zone DEFAULT now(),
    "currentRegistrationDate" timestamp with time zone DEFAULT now(),
    "expirationDate" timestamp with time zone DEFAULT make_date((EXTRACT(year FROM CURRENT_DATE))::integer, 12, 31),
    "registeredByUserId" text,
    "hasOwnAccount" boolean DEFAULT true
);


ALTER TABLE public."Athlete" OWNER TO fgc;

--
-- Name: AthleteGallery; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."AthleteGallery" (
    id text NOT NULL,
    "athleteId" text NOT NULL,
    "imageUrl" text NOT NULL,
    title text,
    description text,
    "order" integer DEFAULT 0 NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AthleteGallery" OWNER TO fgc;

--
-- Name: AthleteProfile; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."AthleteProfile" (
    id text NOT NULL,
    "athleteId" text NOT NULL,
    biography text,
    achievements text,
    "socialMedia" jsonb,
    "websiteUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    gender character varying(10),
    "modalityId" character varying(255),
    "categoryId" character varying(255),
    "genderId" character varying(255)
);


ALTER TABLE public."AthleteProfile" OWNER TO fgc;

--
-- Name: COLUMN "AthleteProfile".gender; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON COLUMN public."AthleteProfile".gender IS 'Gênero do atleta (MALE ou FEMALE)';


--
-- Name: AthleteStatusHistory; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."AthleteStatusHistory" (
    id text NOT NULL,
    "athleteId" text NOT NULL,
    "previousClubId" text,
    "newClubId" text,
    "wasIndividual" boolean NOT NULL,
    "becameIndividual" boolean NOT NULL,
    reason text,
    "paymentId" text,
    "createdAt" timestamp with time zone DEFAULT now()
);


ALTER TABLE public."AthleteStatusHistory" OWNER TO fgc;

--
-- Name: AthletesSectionBanner; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."AthletesSectionBanner" (
    id text NOT NULL,
    title text NOT NULL,
    subtitle text,
    description text,
    "imageUrl" text NOT NULL,
    "ctaText" text DEFAULT 'Conheça nossos Atletas'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public."AthletesSectionBanner" OWNER TO fgc;

--
-- Name: Banner; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Banner" (
    id text NOT NULL,
    title text NOT NULL,
    image text NOT NULL,
    link text,
    "order" integer NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public."Banner" OWNER TO fgc;

--
-- Name: CalendarEvent; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."CalendarEvent" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    startdate timestamp without time zone NOT NULL,
    enddate timestamp without time zone NOT NULL,
    modality character varying(100) NOT NULL,
    category character varying(100) NOT NULL,
    city character varying(100) NOT NULL,
    uf character varying(2) NOT NULL,
    status character varying(50) NOT NULL,
    regulationpdf text,
    website text,
    imageurl text,
    highlight boolean DEFAULT false,
    createdat timestamp without time zone DEFAULT now() NOT NULL,
    updatedat timestamp without time zone DEFAULT now() NOT NULL,
    "bannerUrl" text,
    "bannerFilename" text,
    "bannerTimestamp" bigint
);


ALTER TABLE public."CalendarEvent" OWNER TO fgc;

--
-- Name: COLUMN "CalendarEvent"."bannerUrl"; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON COLUMN public."CalendarEvent"."bannerUrl" IS 'URL completa para o banner do calendário';


--
-- Name: COLUMN "CalendarEvent"."bannerFilename"; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON COLUMN public."CalendarEvent"."bannerFilename" IS 'Nome do arquivo do banner no MinIO';


--
-- Name: COLUMN "CalendarEvent"."bannerTimestamp"; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON COLUMN public."CalendarEvent"."bannerTimestamp" IS 'Timestamp de quando o banner foi atualizado';


--
-- Name: Category; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Category" OWNER TO fgc;

--
-- Name: Champion; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Champion" (
    id text NOT NULL,
    "athleteId" text NOT NULL,
    modality text NOT NULL,
    category text NOT NULL,
    gender text NOT NULL,
    "position" integer NOT NULL,
    city text NOT NULL,
    team text,
    year integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Champion" OWNER TO fgc;

--
-- Name: ChampionCategory; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."ChampionCategory" (
    id text NOT NULL,
    name text NOT NULL,
    "modalityId" text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ChampionCategory" OWNER TO fgc;

--
-- Name: ChampionEntry; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."ChampionEntry" (
    id text NOT NULL,
    "athleteId" text NOT NULL,
    "modalityId" text NOT NULL,
    "categoryId" text NOT NULL,
    gender text NOT NULL,
    "position" integer NOT NULL,
    city text NOT NULL,
    team text,
    "eventId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ChampionEntry" OWNER TO fgc;

--
-- Name: ChampionModality; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."ChampionModality" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ChampionModality" OWNER TO fgc;

--
-- Name: ChampionshipEvent; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."ChampionshipEvent" (
    id text NOT NULL,
    name text NOT NULL,
    year integer NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ChampionshipEvent" OWNER TO fgc;

--
-- Name: City; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."City" (
    id text NOT NULL,
    name text NOT NULL,
    "stateId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."City" OWNER TO fgc;

--
-- Name: Club; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Club" (
    id text NOT NULL,
    "responsibleName" text NOT NULL,
    "clubName" text NOT NULL,
    cnpj text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    "zipCode" text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    "paymentStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "paymentId" text,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Club" OWNER TO fgc;

--
-- Name: ClubFeeSettings; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."ClubFeeSettings" (
    id text NOT NULL,
    "newRegistrationFee" numeric(10,2) NOT NULL,
    "annualRenewalFee" numeric(10,2) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ClubFeeSettings" OWNER TO fgc;

--
-- Name: Country; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Country" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Country" OWNER TO fgc;

--
-- Name: Document; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "fileUrl" text NOT NULL,
    category text DEFAULT 'GERAL'::text,
    downloads integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text NOT NULL,
    "fileName" text NOT NULL,
    "fileSize" integer NOT NULL,
    "mimeType" text NOT NULL
);


ALTER TABLE public."Document" OWNER TO fgc;

--
-- Name: EmailVerification; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."EmailVerification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EmailVerification" OWNER TO fgc;

--
-- Name: Event; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Event" (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    location text NOT NULL,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    published boolean DEFAULT false NOT NULL,
    "coverImage" text,
    "organizerId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "posterImage" text,
    modality text,
    category text,
    gender text DEFAULT 'BOTH'::text NOT NULL,
    "isFree" boolean DEFAULT false NOT NULL,
    "maxParticipants" integer,
    "registrationEnd" timestamp(3) without time zone,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    "modalityId" text,
    "categoryId" text,
    "countryId" text,
    "stateId" text,
    "cityId" text,
    "addressDetails" text,
    "zipCode" text,
    latitude double precision,
    longitude double precision,
    "regulationPdf" text,
    slug character varying,
    "locationUrl" text,
    "resultsFile" character varying
);


ALTER TABLE public."Event" OWNER TO fgc;

--
-- Name: COLUMN "Event"."locationUrl"; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON COLUMN public."Event"."locationUrl" IS 'URL do Google Maps para a localização do evento';


--
-- Name: EventCategory; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."EventCategory" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public."EventCategory" OWNER TO fgc;

--
-- Name: EventCategory_backup; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."EventCategory_backup" (
    id text,
    name text,
    description text,
    "modalityId" text,
    active boolean,
    "createdAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public."EventCategory_backup" OWNER TO fgc;

--
-- Name: EventCouponUsage; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."EventCouponUsage" (
    id text NOT NULL,
    "couponId" text NOT NULL,
    "registrationId" text NOT NULL,
    "discountAmount" numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EventCouponUsage" OWNER TO fgc;

--
-- Name: EventDiscountCoupon; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."EventDiscountCoupon" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    code text NOT NULL,
    discount numeric(5,2) NOT NULL,
    "modalityId" text,
    "categoryId" text,
    "genderId" text,
    "maxUses" integer NOT NULL,
    "usedCount" integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EventDiscountCoupon" OWNER TO fgc;

--
-- Name: EventModality; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."EventModality" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public."EventModality" OWNER TO fgc;

--
-- Name: EventModalityToCategory; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."EventModalityToCategory" (
    "modalityId" text NOT NULL,
    "categoryId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public."EventModalityToCategory" OWNER TO fgc;

--
-- Name: EventPricingByCategory; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."EventPricingByCategory" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "modalityId" text NOT NULL,
    "categoryId" text NOT NULL,
    "genderId" text NOT NULL,
    price numeric(10,2) NOT NULL,
    "tierId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EventPricingByCategory" OWNER TO fgc;

--
-- Name: EventPricingTier; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."EventPricingTier" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "maxEntries" integer,
    active boolean DEFAULT true NOT NULL,
    "eventId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "endTime" character varying(5)
);


ALTER TABLE public."EventPricingTier" OWNER TO fgc;

--
-- Name: COLUMN "EventPricingTier"."endTime"; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON COLUMN public."EventPricingTier"."endTime" IS 'Horário de término do lote no formato HH:MM';


--
-- Name: EventToCategory; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."EventToCategory" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "categoryId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EventToCategory" OWNER TO fgc;

--
-- Name: EventToGender; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."EventToGender" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "genderId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EventToGender" OWNER TO fgc;

--
-- Name: EventToModality; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."EventToModality" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "modalityId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EventToModality" OWNER TO fgc;

--
-- Name: EventTopResult; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."EventTopResult" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "categoryId" text NOT NULL,
    "position" integer NOT NULL,
    "userId" text,
    "athleteName" text NOT NULL,
    "clubId" text,
    "clubName" text,
    result text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EventTopResult" OWNER TO fgc;

--
-- Name: FiliationAnnualConfig; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."FiliationAnnualConfig" (
    id text NOT NULL,
    year integer NOT NULL,
    "initialFilingFee" numeric(10,2) DEFAULT 100.00 NOT NULL,
    "renewalFee" numeric(10,2) DEFAULT 80.00 NOT NULL,
    "clubChangeStatusFee" numeric(10,2) DEFAULT 50.00 NOT NULL,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now(),
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public."FiliationAnnualConfig" OWNER TO fgc;

--
-- Name: FiliationBanner; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."FiliationBanner" (
    id text NOT NULL,
    type text NOT NULL,
    image text NOT NULL,
    title text NOT NULL,
    "buttonText" text,
    "buttonUrl" text,
    "buttonPosition" text DEFAULT 'bottom-right'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "federationId" text
);


ALTER TABLE public."FiliationBanner" OWNER TO fgc;

--
-- Name: TABLE "FiliationBanner"; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON TABLE public."FiliationBanner" IS 'Armazena banners de filiação personalizáveis para atletas e clubes';


--
-- Name: COLUMN "FiliationBanner".type; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON COLUMN public."FiliationBanner".type IS 'Tipo do banner: ATHLETE ou CLUB';


--
-- Name: COLUMN "FiliationBanner".image; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON COLUMN public."FiliationBanner".image IS 'URL da imagem do banner';


--
-- Name: COLUMN "FiliationBanner".title; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON COLUMN public."FiliationBanner".title IS 'Título para acessibilidade/SEO';


--
-- Name: COLUMN "FiliationBanner"."buttonText"; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON COLUMN public."FiliationBanner"."buttonText" IS 'Texto personalizado do botão (opcional)';


--
-- Name: COLUMN "FiliationBanner"."buttonUrl"; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON COLUMN public."FiliationBanner"."buttonUrl" IS 'URL personalizada (opcional, se não fornecida, usa URL padrão)';


--
-- Name: COLUMN "FiliationBanner"."buttonPosition"; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON COLUMN public."FiliationBanner"."buttonPosition" IS 'Posição do botão: bottom-right, bottom-center, center, etc';


--
-- Name: COLUMN "FiliationBanner"."federationId"; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON COLUMN public."FiliationBanner"."federationId" IS 'ID da federação para suporte multi-federação';


--
-- Name: FiliationCategory; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."FiliationCategory" (
    id text NOT NULL,
    name text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public."FiliationCategory" OWNER TO fgc;

--
-- Name: FiliationConfig; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."FiliationConfig" (
    id text DEFAULT 'default-filiation'::text NOT NULL,
    "postPaymentInstructions" text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    "prePaymentInstructions" text,
    "termsAndConditions" text,
    "documentationRequirements" jsonb,
    "paymentMethods" text[] DEFAULT ARRAY['PIX'::text, 'CREDIT_CARD'::text, 'BOLETO'::text],
    "paymentGateways" text[] DEFAULT ARRAY['MERCADOPAGO'::text],
    "notificationSettings" jsonb,
    "filiationPeriod" jsonb,
    "renewalInstructions" text,
    "isActive" boolean DEFAULT true,
    "faqContent" jsonb,
    "contactInfo" jsonb,
    "requiredFields" text[] DEFAULT ARRAY[]::text[],
    "priceSettings" jsonb,
    "discountRules" jsonb,
    "documentValidityPeriod" integer,
    "approvalWorkflow" jsonb
);


ALTER TABLE public."FiliationConfig" OWNER TO fgc;

--
-- Name: FiliationModality; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."FiliationModality" (
    id text NOT NULL,
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public."FiliationModality" OWNER TO fgc;

--
-- Name: FooterConfig; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."FooterConfig" (
    id text DEFAULT 'default-footer'::text NOT NULL,
    logo text DEFAULT '/images/logo-fgc.png'::text NOT NULL,
    background text DEFAULT '#08285d'::text NOT NULL,
    "hoverColor" text DEFAULT '#177cc3'::text NOT NULL,
    "textColor" text DEFAULT '#ffffff'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    cidade text DEFAULT 'Goi├ónia'::text,
    cnpj text DEFAULT 'XX.XXX.XXX/0001-XX'::text,
    endereco text DEFAULT 'Rua XX, no XXX'::text,
    estado text DEFAULT 'GO'::text,
    email text DEFAULT 'contato@fgc.org.br'::text,
    telefone text DEFAULT '(62) 3000-0000'::text,
    whatsapp text DEFAULT '(62) 90000-0000'::text
);


ALTER TABLE public."FooterConfig" OWNER TO fgc;

--
-- Name: FooterMenu; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."FooterMenu" (
    id text NOT NULL,
    label text NOT NULL,
    url text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "requireAuth" boolean DEFAULT false NOT NULL,
    roles text[],
    "footerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public."FooterMenu" OWNER TO fgc;

--
-- Name: GalleryEvent; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."GalleryEvent" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    modality text NOT NULL,
    category text NOT NULL,
    date timestamp without time zone NOT NULL,
    slug text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."GalleryEvent" OWNER TO fgc;

--
-- Name: GalleryImage; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."GalleryImage" (
    id text NOT NULL,
    filename text NOT NULL,
    url text NOT NULL,
    thumbnail text NOT NULL,
    size integer NOT NULL,
    "eventId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."GalleryImage" OWNER TO fgc;

--
-- Name: Gender; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Gender" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Gender" OWNER TO fgc;

--
-- Name: HeaderConfig; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."HeaderConfig" (
    id text DEFAULT 'default-header'::text NOT NULL,
    logo text DEFAULT '/images/logo-fgc.png'::text NOT NULL,
    background text DEFAULT '#08285d'::text NOT NULL,
    "hoverColor" text DEFAULT '#177cc3'::text NOT NULL,
    "textColor" text DEFAULT '#ffffff'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "updatedBy" text
);


ALTER TABLE public."HeaderConfig" OWNER TO fgc;

--
-- Name: HeaderMenu; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."HeaderMenu" (
    id text NOT NULL,
    label text NOT NULL,
    url text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "headerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "requireAuth" boolean DEFAULT false NOT NULL,
    roles text[],
    "updatedBy" text
);


ALTER TABLE public."HeaderMenu" OWNER TO fgc;

--
-- Name: Indicator; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Indicator" (
    id text NOT NULL,
    title text NOT NULL,
    value text NOT NULL,
    icon text,
    "order" integer NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    subtitle text,
    "iconColor" character varying(50),
    "backgroundColor" character varying(50),
    "textColor" character varying(50)
);


ALTER TABLE public."Indicator" OWNER TO fgc;

--
-- Name: LegalDocuments; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."LegalDocuments" (
    id text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public."LegalDocuments" OWNER TO fgc;

--
-- Name: ModalityCategoryGender; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."ModalityCategoryGender" (
    id text NOT NULL,
    "modalityId" text NOT NULL,
    "categoryId" text NOT NULL,
    "genderId" text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public."ModalityCategoryGender" OWNER TO fgc;

--
-- Name: TABLE "ModalityCategoryGender"; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON TABLE public."ModalityCategoryGender" IS 'Tabela de relacionamento triplo entre modalidades, categorias e gêneros para eventos';


--
-- Name: ModalityToCategory; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."ModalityToCategory" (
    "modalityId" text NOT NULL,
    "categoryId" text NOT NULL
);


ALTER TABLE public."ModalityToCategory" OWNER TO fgc;

--
-- Name: News; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."News" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text NOT NULL,
    excerpt text,
    "coverImage" text,
    published boolean DEFAULT false NOT NULL,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone
);


ALTER TABLE public."News" OWNER TO fgc;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    type text NOT NULL,
    recipient text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Notification" OWNER TO fgc;

--
-- Name: NotificationAttempt; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."NotificationAttempt" (
    id text NOT NULL,
    "notificationId" text NOT NULL,
    channel text NOT NULL,
    success boolean NOT NULL,
    error text,
    "providerId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."NotificationAttempt" OWNER TO fgc;

--
-- Name: NotificationConfig; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."NotificationConfig" (
    id text NOT NULL,
    "whatsappEnabled" boolean DEFAULT false NOT NULL,
    "emailEnabled" boolean DEFAULT true NOT NULL,
    "webhookEnabled" boolean DEFAULT false NOT NULL,
    "whatsappToken" text,
    "whatsappPhoneId" text,
    "webhookUrl" text,
    "maxRetries" integer DEFAULT 3 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NotificationConfig" OWNER TO fgc;

--
-- Name: NotificationLog; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."NotificationLog" (
    id text NOT NULL,
    type text NOT NULL,
    recipient text NOT NULL,
    channel text NOT NULL,
    status text NOT NULL,
    error text,
    metadata jsonb,
    "sentAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NotificationLog" OWNER TO fgc;

--
-- Name: NotificationTemplate; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."NotificationTemplate" (
    id text NOT NULL,
    type text NOT NULL,
    channel text NOT NULL,
    name text NOT NULL,
    content text NOT NULL,
    variables text[],
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NotificationTemplate" OWNER TO fgc;

--
-- Name: Partner; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Partner" (
    id text NOT NULL,
    name text NOT NULL,
    logo text NOT NULL,
    link text,
    "order" integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public."Partner" OWNER TO fgc;

--
-- Name: PasswordReset; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."PasswordReset" (
    id text NOT NULL,
    email text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text,
    active boolean DEFAULT true,
    "updatedAt" timestamp(3) without time zone
);


ALTER TABLE public."PasswordReset" OWNER TO fgc;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    provider text NOT NULL,
    status text NOT NULL,
    "paymentMethod" text NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency text NOT NULL,
    "athleteId" text,
    "clubId" text,
    "registrationId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "externalId" text NOT NULL,
    "paymentData" jsonb NOT NULL
);


ALTER TABLE public."Payment" OWNER TO fgc;

--
-- Name: PaymentGatewayConfig; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."PaymentGatewayConfig" (
    id text NOT NULL,
    name text NOT NULL,
    provider text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "allowedMethods" text[] NOT NULL,
    "entityTypes" text[] NOT NULL,
    "checkoutType" text DEFAULT 'REDIRECT'::text NOT NULL,
    sandbox boolean DEFAULT false NOT NULL,
    webhook jsonb,
    urls jsonb,
    credentials jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text NOT NULL,
    "updatedBy" text NOT NULL
);


ALTER TABLE public."PaymentGatewayConfig" OWNER TO fgc;

--
-- Name: PaymentHistory; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."PaymentHistory" (
    id text NOT NULL,
    "transactionId" text NOT NULL,
    status public."PaymentStatus" NOT NULL,
    description text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PaymentHistory" OWNER TO fgc;

--
-- Name: PaymentTransaction; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."PaymentTransaction" (
    id text NOT NULL,
    "gatewayConfigId" text NOT NULL,
    "entityId" text NOT NULL,
    amount numeric(10,2) NOT NULL,
    description text,
    "paymentMethod" public."PaymentMethod" NOT NULL,
    "paymentUrl" text,
    "externalId" text,
    metadata jsonb,
    "expiresAt" timestamp(3) without time zone,
    "paidAt" timestamp(3) without time zone,
    "canceledAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "athleteId" text,
    protocol text NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "entityType" text NOT NULL,
    CONSTRAINT valid_entity_type CHECK (("entityType" = ANY (ARRAY['ATHLETE_REGISTRATION'::text, 'CLUB_REGISTRATION'::text, 'EVENT_REGISTRATION'::text, 'MEMBERSHIP'::text, 'OTHER'::text])))
);


ALTER TABLE public."PaymentTransaction" OWNER TO fgc;

--
-- Name: Protocol; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Protocol" (
    id text NOT NULL,
    number text NOT NULL,
    type text NOT NULL,
    "entityId" text NOT NULL,
    "paymentId" text NOT NULL,
    status text NOT NULL,
    metadata jsonb NOT NULL,
    year integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Protocol" OWNER TO fgc;

--
-- Name: ProtocolSequence; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."ProtocolSequence" (
    id text NOT NULL,
    type text NOT NULL,
    year integer NOT NULL,
    sequence integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProtocolSequence" OWNER TO fgc;

--
-- Name: Ranking; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Ranking" (
    id text NOT NULL,
    "athleteId" text NOT NULL,
    modality text NOT NULL,
    category text NOT NULL,
    gender text NOT NULL,
    points integer NOT NULL,
    "position" integer NOT NULL,
    city text NOT NULL,
    team text,
    season integer NOT NULL,
    "updatedAt" timestamp(6) without time zone NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Ranking" OWNER TO fgc;

--
-- Name: RankingCategory; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."RankingCategory" (
    id text NOT NULL,
    name text NOT NULL,
    "modalityId" text NOT NULL,
    description text,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RankingCategory" OWNER TO fgc;

--
-- Name: TABLE "RankingCategory"; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON TABLE public."RankingCategory" IS 'Tabela criada manualmente para armazenar categorias de ranking';


--
-- Name: RankingConfiguration; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."RankingConfiguration" (
    id text NOT NULL,
    name text NOT NULL,
    "modalityId" text NOT NULL,
    "categoryId" text NOT NULL,
    gender text NOT NULL,
    season integer NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."RankingConfiguration" OWNER TO fgc;

--
-- Name: RankingEntry; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."RankingEntry" (
    id text NOT NULL,
    "configurationId" text NOT NULL,
    "athleteId" text NOT NULL,
    points integer NOT NULL,
    "position" integer NOT NULL,
    city text NOT NULL,
    team text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."RankingEntry" OWNER TO fgc;

--
-- Name: RankingModality; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."RankingModality" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RankingModality" OWNER TO fgc;

--
-- Name: TABLE "RankingModality"; Type: COMMENT; Schema: public; Owner: fgc
--

COMMENT ON TABLE public."RankingModality" IS 'Tabela criada manualmente para armazenar modalidades de ranking';


--
-- Name: RankingStageResult; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."RankingStageResult" (
    id text NOT NULL,
    "rankingId" text NOT NULL,
    "athleteId" text NOT NULL,
    modality text NOT NULL,
    category text NOT NULL,
    gender text NOT NULL,
    "stageName" text NOT NULL,
    "position" integer NOT NULL,
    points integer NOT NULL,
    season integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "modalityId" text,
    "categoryId" text,
    "entryId" text
);


ALTER TABLE public."RankingStageResult" OWNER TO fgc;

--
-- Name: Registration; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Registration" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text NOT NULL,
    cpf text,
    protocol text,
    birthdate timestamp without time zone,
    modalityid text,
    categoryid text,
    genderid text,
    tierid text,
    addressdata text,
    "couponId" text,
    "discountAmount" numeric(10,2)
);


ALTER TABLE public."Registration" OWNER TO fgc;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO fgc;

--
-- Name: SmallBanner; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."SmallBanner" (
    id text NOT NULL,
    title text NOT NULL,
    image text NOT NULL,
    link text,
    "position" integer NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public."SmallBanner" OWNER TO fgc;

--
-- Name: Sponsor; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."Sponsor" (
    id text NOT NULL,
    name text NOT NULL,
    logo text NOT NULL,
    link text,
    "order" integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public."Sponsor" OWNER TO fgc;

--
-- Name: State; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."State" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "countryId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."State" OWNER TO fgc;

--
-- Name: TempRegistration; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."TempRegistration" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    document text,
    phone text,
    "birthDate" timestamp(3) without time zone,
    "modalityId" text NOT NULL,
    "categoryId" text NOT NULL,
    "genderId" text NOT NULL,
    "tierId" text NOT NULL,
    "addressData" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    cpf text,
    birthdate timestamp without time zone,
    modalityid text,
    categoryid text,
    genderid text,
    tierid text,
    addressdata text
);


ALTER TABLE public."TempRegistration" OWNER TO fgc;

--
-- Name: User; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text,
    email text,
    "emailVerified" timestamp(3) without time zone,
    image text,
    password text NOT NULL,
    role text DEFAULT 'USER'::text NOT NULL,
    "isManager" boolean DEFAULT false,
    "managedClubId" text,
    phone character varying(255)
);


ALTER TABLE public."User" OWNER TO fgc;

--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO fgc;

--
-- Name: _CategoryToNews; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public."_CategoryToNews" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_CategoryToNews" OWNER TO fgc;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO fgc;

--
-- Name: newsimage; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public.newsimage (
    id text NOT NULL,
    news_id text NOT NULL,
    url text NOT NULL,
    alt text,
    image_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.newsimage OWNER TO fgc;

--
-- Name: payment_system_config; Type: TABLE; Schema: public; Owner: fgc
--

CREATE TABLE public.payment_system_config (
    id text DEFAULT 'payment-config'::text NOT NULL,
    "notificationEmails" text[],
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payment_system_config OWNER TO fgc;

--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: Athlete; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Athlete" (id, "userId", "fullName", cpf, "birthDate", address, city, state, "zipCode", phone, modalities, category, "paymentStatus", "paymentId", active, "createdAt", "updatedAt", email, "cbcRegistration", "clubId", "isIndividual", "registrationYear", "isRenewal", "firstRegistrationDate", "currentRegistrationDate", "expirationDate", "registeredByUserId", "hasOwnAccount") FROM stdin;
cm7kzddeg0005tiezgu7mny7o	cm7kzdded0003tiezwi59ygcp	Atleta Teste 2	12345678902	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:20.44	2025-02-25 21:10:20.44	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzddh90008tiezwwcrd3b8	cm7kzddh50006tiezk9ih5dih	Atleta Teste 3	12345678903	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:20.541	2025-02-25 21:10:20.541	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzddkr000btiezu82356es	cm7kzddkh0009tiez291ptfqk	Atleta Teste 4	12345678904	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:20.667	2025-02-25 21:10:20.667	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzddnc000etiezr7ux0g1r	cm7kzddn9000ctiezutxosfej	Atleta Teste 5	12345678905	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:20.76	2025-02-25 21:10:20.76	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzddpq000htiezgjh0rch1	cm7kzddpo000ftieziz8div3v	Atleta Teste 6	12345678906	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:20.847	2025-02-25 21:10:20.847	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzddrz000ktiezhqyu2moj	cm7kzddrx000itiez2k6x3hso	Atleta Teste 7	12345678907	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:20.928	2025-02-25 21:10:20.928	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzddud000ntiez55lyvek6	cm7kzddu9000ltiez6d3gg30f	Atleta Teste 8	12345678908	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:21.013	2025-02-25 21:10:21.013	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzddx1000qtiezbv0ad3bw	cm7kzddww000otiezjec8og4h	Atleta Teste 9	12345678909	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:21.109	2025-02-25 21:10:21.109	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzde07000ttiezntdlxq9h	cm7kzde04000rtiezgpt9xa7a	Atleta Teste 10	12345678910	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:21.224	2025-02-25 21:10:21.224	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzde3p000wtiezjj1xttq9	cm7kzde3e000utiez3m8ucd0v	Atleta Teste 11	12345678911	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:21.349	2025-02-25 21:10:21.349	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzde6h000ztiezzgyxgnky	cm7kzde6c000xtiez52ui6q5w	Atleta Teste 12	12345678912	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:21.448	2025-02-25 21:10:21.448	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzde9w0012tiezfsd4drqw	cm7kzde9q0010tiez3cgegpfh	Atleta Teste 13	12345678913	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:21.573	2025-02-25 21:10:21.573	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdecu0015tiezofutcwkn	cm7kzdecr0013tiezxe8m3l5f	Atleta Teste 14	12345678914	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:21.679	2025-02-25 21:10:21.679	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdega0018tiez3hloonk4	cm7kzdefw0016tiezlenz7pl0	Atleta Teste 15	12345678915	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:21.802	2025-02-25 21:10:21.802	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdeit001btiez5rw9ebwy	cm7kzdeio0019tiezxh9s6g2x	Atleta Teste 16	12345678916	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:21.893	2025-02-25 21:10:21.893	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdem2001etiez562qh0av	cm7kzdelz001ctiezaqcqc4pp	Atleta Teste 17	12345678917	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:22.01	2025-02-25 21:10:22.01	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdeoe001htiezrjrt19ky	cm7kzdeoa001ftiezyc8m6xw9	Atleta Teste 18	12345678918	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:22.094	2025-02-25 21:10:22.094	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdeqs001ktiezz18ojw3u	cm7kzdeqp001itiezoorxgzqq	Atleta Teste 19	12345678919	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:22.18	2025-02-25 21:10:22.18	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdet9001ntiezdvpf7vzh	cm7kzdet3001ltiezta96wsqi	Atleta Teste 20	12345678920	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:22.269	2025-02-25 21:10:22.269	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdevi001qtiezgj73csub	cm7kzdevd001otiez58r2ylk8	Atleta Teste 21	12345678921	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:22.351	2025-02-25 21:10:22.351	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdexv001ttiezd9qp4fnd	cm7kzdexq001rtiezprxxna5g	Atleta Teste 22	12345678922	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:22.435	2025-02-25 21:10:22.435	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdf0h001wtiezw62tl467	cm7kzdf0f001utiezxygpymrl	Atleta Teste 23	12345678923	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:22.53	2025-02-25 21:10:22.53	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdf2o001ztiezivpdg041	cm7kzdf2l001xtiezqu3mia26	Atleta Teste 24	12345678924	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:22.609	2025-02-25 21:10:22.609	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdf510022tiezbd1efwid	cm7kzdf4y0020tiez5y3u67yw	Atleta Teste 25	12345678925	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:22.694	2025-02-25 21:10:22.694	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdf7q0025tiez3gix3ql8	cm7kzdf7g0023tiez0jprhb07	Atleta Teste 26	12345678926	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:22.79	2025-02-25 21:10:22.79	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdf9v0028tiezbkj6976d	cm7kzdf9q0026tiezxd4bpatf	Atleta Teste 27	12345678927	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:22.867	2025-02-25 21:10:22.867	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdfbt002btiez0v85maax	cm7kzdfbp0029tiezaeeegzmp	Atleta Teste 28	12345678928	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:22.937	2025-02-25 21:10:22.937	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdfdu002etiez52icz8n9	cm7kzdfdr002ctiezk8vgk50i	Atleta Teste 29	12345678929	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:23.01	2025-02-25 21:10:23.01	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdffv002htiezgs1sdodk	cm7kzdffr002ftiezj793qg3z	Atleta Teste 30	12345678930	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:23.083	2025-02-25 21:10:23.083	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdfht002ktiezl6dnrgr7	cm7kzdfhq002itiezgt4ano88	Atleta Teste 31	12345678931	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:23.154	2025-02-25 21:10:23.154	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdfjt002ntiezaqjbtp32	cm7kzdfjq002ltiez6ty1siq1	Atleta Teste 32	12345678932	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:23.225	2025-02-25 21:10:23.225	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdflr002qtiezov2qisq5	cm7kzdflo002otiez7eg27duy	Atleta Teste 33	12345678933	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:23.295	2025-02-25 21:10:23.295	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdfns002ttiez41h7qo5e	cm7kzdfnn002rtiez5hwi4q71	Atleta Teste 34	12345678934	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:23.368	2025-02-25 21:10:23.368	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdfpp002wtiezegshp6z9	cm7kzdfpm002utiezdghdlq28	Atleta Teste 35	12345678935	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:23.438	2025-02-25 21:10:23.438	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdfrt002ztiezc5045vpx	cm7kzdfrp002xtiez6wrr5r2i	Atleta Teste 36	12345678936	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:23.514	2025-02-25 21:10:23.514	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdftu0032tiezk6yg4l3e	cm7kzdftp0030tiezzj8vxu9u	Atleta Teste 37	12345678937	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:23.586	2025-02-25 21:10:23.586	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdfw00035tiezy82xhqru	cm7kzdfvx0033tiezmxwzu4a4	Atleta Teste 38	12345678938	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:23.664	2025-02-25 21:10:23.664	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdfxy0038tiezpjjkelsl	cm7kzdfxt0036tiezaloztm7t	Atleta Teste 39	12345678939	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:23.734	2025-02-25 21:10:23.734	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdfzw003btiezmybkw0bj	cm7kzdfzt0039tiez66dztr1s	Atleta Teste 40	12345678940	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:23.805	2025-02-25 21:10:23.805	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdg1t003etiez8bn0c7gi	cm7kzdg1q003ctiezc7dquzvg	Atleta Teste 41	12345678941	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:23.873	2025-02-25 21:10:23.873	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdg3q003htiezu3itd6dy	cm7kzdg3n003ftiez1o7q7w2w	Atleta Teste 42	12345678942	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:23.943	2025-02-25 21:10:23.943	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdg5q003ktiez9iv81n5j	cm7kzdg5o003itiezd8s9jzem	Atleta Teste 43	12345678943	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:24.014	2025-02-25 21:10:24.014	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdg7q003ntiezau32los1	cm7kzdg7n003ltiezsnwdn8f9	Atleta Teste 44	12345678944	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:24.087	2025-02-25 21:10:24.087	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdg9r003qtiezxf3io009	cm7kzdg9n003otieznyj866zk	Atleta Teste 45	12345678945	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:24.159	2025-02-25 21:10:24.159	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdgc2003ttiezuq1o94h4	cm7kzdgc0003rtiezrlfsq2gf	Atleta Teste 46	12345678946	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:24.243	2025-02-25 21:10:24.243	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdge0003wtiezc5kktao5	cm7kzdgdx003utiezgbcwh7m1	Atleta Teste 47	12345678947	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:24.312	2025-02-25 21:10:24.312	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdgfx003ztiezku64j528	cm7kzdgfu003xtieznglmpfyn	Atleta Teste 48	12345678948	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:24.381	2025-02-25 21:10:24.381	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdghy0042tiezq2v888zj	cm7kzdght0040tiez8ng41zkd	Atleta Teste 49	12345678949	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:24.455	2025-02-25 21:10:24.455	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdgjz0045tiez25kdmubr	cm7kzdgjx0043tiez909ws1d6	Atleta Teste 50	12345678950	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:24.528	2025-02-25 21:10:24.528	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdgm00048tiezoivksh7i	cm7kzdglw0046tiezy0fq3pnj	Atleta Teste 51	12345678951	1990-01-01 02:00:00	Rua de Teste	Goi├ónia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:24.6	2025-02-25 21:10:24.6	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
efcf00ec-2275-4cd4-853f-2a2b4cb72043	c1f4f260-66f5-4488-b47d-039f727d5f53	Fernanda Lima	temp_1742349813445_5	2025-03-19 02:03:33.445	Endere├ºo n├úo informado	Bras├¡lia	Estado n├úo informado	00000-000	N├úo informado	{MTB}	Elite	PAID	\N	t	2025-03-19 02:03:33.448	2025-03-19 02:03:33.445	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
2448b5a7-ed67-4845-8bb5-bbc2999eaff4	374a3ca7-20fa-45dd-b108-747f75fd9c42	Gabriela Martins	temp_1742349813466_6	2025-03-19 02:03:33.466	Endere├ºo n├úo informado	Salvador	Estado n├úo informado	00000-000	N├úo informado	{MTB}	Elite	PAID	\N	t	2025-03-19 02:03:33.47	2025-03-19 02:03:33.466	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
47c65561-a0e3-484c-99ae-9a27d5db527c	ef260aa5-b4b8-4d12-87fa-56efecd34ab5	Helena Pereira	temp_1742349813484_7	2025-03-19 02:03:33.484	Endere├ºo n├úo informado	Fortaleza	Estado n├úo informado	00000-000	N├úo informado	{MTB}	Elite	PAID	\N	t	2025-03-19 02:03:33.487	2025-03-19 02:03:33.484	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
266d7f1b-b481-4102-8f82-2a6593d19413	a01c1044-4e63-4f03-9f35-1a25875e244e	Isabela Rodrigues	temp_1742349813503_8	2025-03-19 02:03:33.503	Endere├ºo n├úo informado	Recife	Estado n├úo informado	00000-000	N├úo informado	{MTB}	Elite	PAID	\N	t	2025-03-19 02:03:33.507	2025-03-19 02:03:33.503	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
e77ebac8-86e7-4b49-beb4-bfc443695b29	f6d56698-ba6e-443a-bc8b-43d36b3e0b8c	Ana Silva	temp_1742349813160_0	2025-03-19 02:03:33.16	Endere├ºo n├úo informado	S├úo Paulo	Estado n├úo informado	00000-000	N├úo informado	{MTB}	Elite	PAID	\N	t	2025-03-19 02:03:33.19	2025-03-19 02:03:33.16	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
19b46922-2b89-4432-b9af-89cdb0fc175c	eedeba89-5004-4838-acb7-26a60a0f1934	Beatriz Oliveira	temp_1742349813364_1	2025-03-19 02:03:33.364	Endere├ºo n├úo informado	Rio de Janeiro	Estado n├úo informado	00000-000	N├úo informado	{MTB}	Elite	PAID	\N	t	2025-03-19 02:03:33.368	2025-03-19 02:03:33.364	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
f141246f-2cfb-4318-a5fa-0edd83befb4f	e4da9446-6ebe-4015-aa98-409ffe79fb7b	Carolina Santos	temp_1742349813387_2	2025-03-19 02:03:33.387	Endere├ºo n├úo informado	Belo Horizonte	Estado n├úo informado	00000-000	N├úo informado	{MTB}	Elite	PAID	\N	t	2025-03-19 02:03:33.39	2025-03-19 02:03:33.387	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
94584909-5b5a-4c19-a6b2-f4a1c29465b6	618676b6-92ba-4bbc-ac74-e8c31eda70b2	Daniela Costa	temp_1742349813407_3	2025-03-19 02:03:33.407	Endere├ºo n├úo informado	Curitiba	Estado n├úo informado	00000-000	N├úo informado	{MTB}	Elite	PAID	\N	t	2025-03-19 02:03:33.41	2025-03-19 02:03:33.407	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
9b7a05de-cd9d-48d1-ac24-b15f0b381c93	823ebfb2-9d8f-49dd-8dc5-ae01e8a6f4a7	Elisa Ferreira	temp_1742349813428_4	2025-03-19 02:03:33.428	Endere├ºo n├úo informado	Porto Alegre	Estado n├úo informado	00000-000	N├úo informado	{MTB}	Elite	PAID	\N	t	2025-03-19 02:03:33.431	2025-03-19 02:03:33.428	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
28a9fa14-334e-4056-9a8f-0a1611d9b631	14904885-43b6-4496-8b8f-52e6c78e2d71	Juliana Almeida	temp_1742349813522_9	2025-03-19 02:03:33.522	Endere├ºo n├úo informado	Manaus	Estado n├úo informado	00000-000	N├úo informado	{MTB}	Elite	PAID	\N	t	2025-03-19 02:03:33.526	2025-03-19 02:03:33.522	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
fcf7027f-c0f7-47bd-8d1d-1525d545d098	a7809079-e86c-4aea-b456-0351e194ffa0	Karina Souza	temp_1742349813545_10	2025-03-19 02:03:33.545	Endere├ºo n├úo informado	Florian├│polis	Estado n├úo informado	00000-000	N├úo informado	{MTB}	Elite	PAID	\N	t	2025-03-19 02:03:33.548	2025-03-19 02:03:33.545	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
fc101bfa-42a8-42ba-9580-d0e5c52065fd	ae89b198-fe3c-41cd-b10b-f692c577128b	Mariana Cardoso	temp_1742349813580_12	2025-03-19 02:03:33.58	Endere├ºo n├úo informado	Vit├│ria	Estado n├úo informado	00000-000	N├úo informado	{MTB}	Elite	PAID	\N	t	2025-03-19 02:03:33.584	2025-03-19 02:03:33.58	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
763c856d-65f8-4075-a9d8-95539f724eda	b804c957-3887-4d0d-b487-f66e719e2814	Nat├ília Ribeiro	temp_1742349813599_13	2025-03-19 02:03:33.599	Endere├ºo n├úo informado	Natal	Estado n├úo informado	00000-000	N├úo informado	{MTB}	Elite	PAID	\N	t	2025-03-19 02:03:33.603	2025-03-19 02:03:33.599	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
594b4972-b95c-4961-bd4a-1448d501fce0	e9109ce4-8544-49b5-ba4d-624461e276af	Ol├¡via Gomes	temp_1742349813616_14	2025-03-19 02:03:33.616	Endere├ºo n├úo informado	Jo├úo Pessoa	Estado n├úo informado	00000-000	N├úo informado	{MTB}	Elite	PAID	\N	t	2025-03-19 02:03:33.62	2025-03-19 02:03:33.616	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
cm7kzdd9b0002tiez8io57mt0	cm7kzdd4g0000tiez3a9g0lok	Atleta Teste 1	12345678901	1990-01-01 02:00:00	Rua de Teste	Goiânia	GO	74000000	62999999999	{MTB,ROAD}	ELITE	PAID	\N	t	2025-02-25 21:10:20.228	2025-03-29 17:12:04.174	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
55e59c61-1f86-459c-8e06-55fcb115a432	0ae569d4-e20f-4a44-bde3-ef29b05e112f	Fulano de tal	97268953089	1977-04-11 00:00:00	Rua Coelho Neto	Goiânia	GO	74360-290	62999992199	{bcddde3d-45d3-4a6c-a098-df953056e0d1}	8b5148e5-bde5-46a0-b10e-1a50161fe2dd	CONFIRMED	52ada2e8-8ee6-4a7e-819f-fce170e69801	t	2025-04-02 20:55:15.534	2025-04-02 22:26:27.256	w.betofoto@gmail.com	0123	4c832113-1796-418a-b402-723bf88d6b62	f	2025	f	2025-04-02 20:55:15.534+00	2025-04-02 20:55:15.534+00	2025-12-31 03:00:00+00	\N	t
004492b2-41e7-406b-8674-5d619ceb312a	0214a905-cbfc-4a43-bdeb-13e05d4f7ec9	Larissa Mendes	temp_1742349813562_11	2025-03-19 02:03:33.562	Endere├ºo n├úo informado	Goi├ónia	Estado n├úo informado	00000-000	5562981216988	{MTB}	Elite	PAID	\N	t	2025-03-19 02:03:33.565	2025-03-19 02:03:33.562	\N	\N	\N	f	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	5fa9fec3-1936-431d-bbac-faf36c62c043	Beto Teste	94647810178	1977-04-11 00:00:00	Rua J62	Goiânia	GO	74674-280	(62) 99999-9991	{b12a1f42-8530-4a25-ab1f-f3a4661e4929}	62a31363-0fc0-4310-a3b5-cce09e11898c	PENDING	8eb8e0aa-10b2-4a82-9d0d-335d0c21ebd9	f	2025-03-18 12:44:29.185	2025-04-05 19:28:39.219	alanna4107@uorak.com	\N	\N	t	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
temp_457741f4-177b-471a-ae2c-c8320411e33b	457741f4-177b-471a-ae2c-c8320411e33b	Weberty Gerolineto	temp_457741f4-177b-471a-ae2c-c8320411e33b	1977-04-11 00:00:00	Rua J62	Goiânia	GO	74674-280	5562994242329	{402e9e9d-3fd1-49c9-b6f4-12413801fb14,00ef4e35-0e03-4387-ac8b-2e70a0ecef49,bcddde3d-45d3-4a6c-a098-df953056e0d1}		CONFIRMED	41d4d336-4eab-40d0-a000-4ef86e053f18	t	2025-03-30 01:02:48.532	2025-05-16 00:11:32.554	betofoto1@gmail.com	\N	f7335e49-b64c-496d-ae10-36396b549e28	t	2025	f	2025-04-02 15:45:20.977199+00	2025-04-02 15:45:20.977199+00	2025-12-31 00:00:00+00	\N	t
\.


--
-- Data for Name: AthleteGallery; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."AthleteGallery" (id, "athleteId", "imageUrl", title, description, "order", featured, "createdAt", "updatedAt") FROM stdin;
8244007d-995a-4dc8-a090-010c34b6ba69	temp_457741f4-177b-471a-ae2c-c8320411e33b	athlete-1747578352216-jb77r9jr.jpg	\N	\N	6	f	2025-05-18 14:25:52.445	2025-05-18 14:25:52.443
4e6bd687-b8cc-4ea0-8223-4df49c937792	temp_457741f4-177b-471a-ae2c-c8320411e33b	athlete-1747604783099-ode5i96l.png	Teste de titulo apos upload	So mais um teste de titulo apos upload	7	f	2025-05-18 21:46:23.3	2025-05-18 21:48:48.491
d474adec-bd74-48a4-ac0a-a00141987de9	temp_457741f4-177b-471a-ae2c-c8320411e33b	athlete-1747506275928-ksnfcyij.jpg	teste da foto de perfil		0	f	2025-05-17 18:24:36.803	2025-05-17 18:25:08.676
18597028-6073-4357-b390-23109790b364	temp_457741f4-177b-471a-ae2c-c8320411e33b	athlete-1747506493352-m1deiaxb.png	\N	\N	1	f	2025-05-17 18:28:13.871	2025-05-17 18:28:13.87
2ee9c277-8e97-4739-a6d5-8cd508ef85b7	temp_457741f4-177b-471a-ae2c-c8320411e33b	athlete-1747508167400-9ol0kmpw.jpg	\N	\N	2	f	2025-05-17 18:56:11.841	2025-05-17 18:56:11.84
fa9a3308-74e7-41e4-8bba-d76838e5da94	temp_457741f4-177b-471a-ae2c-c8320411e33b	athlete-1747526083055-kkeehu6b.png	\N	\N	3	f	2025-05-17 23:54:44.319	2025-05-17 23:54:44.318
d1627732-cc81-4b11-9b8f-8f517204094c	temp_457741f4-177b-471a-ae2c-c8320411e33b	athlete-1747527596776-hnrb1w7i.png	\N	\N	4	f	2025-05-18 00:19:57.766	2025-05-18 00:19:57.765
34f57621-744a-46d7-a457-2245a711aea0	temp_457741f4-177b-471a-ae2c-c8320411e33b	athlete-1747528815166-2kng37hv.png	\N	\N	5	t	2025-05-18 00:40:16.232	2025-05-18 00:40:16.23
\.


--
-- Data for Name: AthleteProfile; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."AthleteProfile" (id, "athleteId", biography, achievements, "socialMedia", "websiteUrl", "createdAt", "updatedAt", gender, "modalityId", "categoryId", "genderId") FROM stdin;
a7e9c0f3-e046-4fe3-8ee0-ebfea6d5fc30	9b7a05de-cd9d-48d1-ac24-b15f0b381c93	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
6e962831-51fe-45b0-9d85-978551cde0c5	fcf7027f-c0f7-47bd-8d1d-1525d545d098	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
55986326-d79a-40a3-9cab-996a45262b74	763c856d-65f8-4075-a9d8-95539f724eda	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
ab690181-42e6-4dc7-91a0-89def6f47ffd	594b4972-b95c-4961-bd4a-1448d501fce0	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
e0196599-068c-4e4b-a9d4-977d0db9b3e7	efcf00ec-2275-4cd4-853f-2a2b4cb72043	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	FEMALE	\N	\N	7718a8b0-03f1-42af-a484-6176f8bf055e
055e3632-af70-4593-b460-74aa91b1589b	2448b5a7-ed67-4845-8bb5-bbc2999eaff4	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	FEMALE	\N	\N	7718a8b0-03f1-42af-a484-6176f8bf055e
58613aef-657b-4068-8e84-4c1107199036	47c65561-a0e3-484c-99ae-9a27d5db527c	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	FEMALE	\N	\N	7718a8b0-03f1-42af-a484-6176f8bf055e
26e08bce-f3c0-4bbf-866c-6fe5fb1fe930	266d7f1b-b481-4102-8f82-2a6593d19413	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	FEMALE	\N	\N	7718a8b0-03f1-42af-a484-6176f8bf055e
1b703b2e-7fc9-4a10-b114-c1e46fbeb632	e77ebac8-86e7-4b49-beb4-bfc443695b29	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	FEMALE	\N	\N	7718a8b0-03f1-42af-a484-6176f8bf055e
98ca127d-1d5b-471b-9080-bc60b9dd8aa6	19b46922-2b89-4432-b9af-89cdb0fc175c	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	FEMALE	\N	\N	7718a8b0-03f1-42af-a484-6176f8bf055e
a280a3f0-7c69-42ad-a9ad-22767f07120f	f141246f-2cfb-4318-a5fa-0edd83befb4f	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	FEMALE	\N	\N	7718a8b0-03f1-42af-a484-6176f8bf055e
1f6fde7f-d7fc-4f51-890b-b25618601e96	94584909-5b5a-4c19-a6b2-f4a1c29465b6	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	FEMALE	\N	\N	7718a8b0-03f1-42af-a484-6176f8bf055e
74d807d8-aa2f-49f4-804f-bcdebda4ac78	28a9fa14-334e-4056-9a8f-0a1611d9b631	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	FEMALE	\N	\N	7718a8b0-03f1-42af-a484-6176f8bf055e
9be0e39e-66d7-4a3d-b9da-65ec5d8fc1a4	fc101bfa-42a8-42ba-9580-d0e5c52065fd	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	FEMALE	\N	\N	7718a8b0-03f1-42af-a484-6176f8bf055e
4ede1fdf-5df3-481e-8bd8-914ce365b08a	cm7kzddrz000ktiezhqyu2moj	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
12780384-0801-49b9-877e-54b43b7ed104	cm7kzddud000ntiez55lyvek6	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
63e230f4-6a54-4638-bdd6-983b18886cec	cm7kzddx1000qtiezbv0ad3bw	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
ad687ee3-674c-4725-ae7c-2e866e75a82d	cm7kzde07000ttiezntdlxq9h	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
2aeec626-dc0b-4273-84b6-c87df1a4158b	cm7kzde3p000wtiezjj1xttq9	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
d1fc10b8-bbdb-45bb-88a4-9571cd13503c	cm7kzde6h000ztiezzgyxgnky	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
b6329f64-2134-486a-9858-fa25061bd8da	temp_457741f4-177b-471a-ae2c-c8320411e33b	teste 	teste	{"twitter": "", "facebook": "", "instagram": ""}		2025-05-15 19:17:11.507	2025-05-17 17:27:14.522	MALE	cm7ro2ao80001kja8o4jdj323	cm7roxtzq0011kja8s7xxmq2n	b4f82f14-79d6-4123-a29b-4d45ff890a52
5e2a4626-aefa-4794-b1dd-b73276e37522	cm7kzde9w0012tiezfsd4drqw	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
5958fdda-260c-4da4-86b3-d7cd1d714e86	cm7kzdecu0015tiezofutcwkn	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
3197c309-86ff-4b00-af89-71eebc11a7a5	cm7kzdega0018tiez3hloonk4	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
bc1037a1-ca8f-48d6-9551-9f5a5d835e2f	55e59c61-1f86-459c-8e06-55fcb115a432	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	FEMALE	cm7rod87g0003kja83a2xjgwv	\N	7718a8b0-03f1-42af-a484-6176f8bf055e
c03f07dc-1a81-4814-9c74-128d1b08726c	004492b2-41e7-406b-8674-5d619ceb312a	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	FEMALE	\N	\N	7718a8b0-03f1-42af-a484-6176f8bf055e
02c04666-51d5-4a83-ac89-8e68828fed90	6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	FEMALE	\N	\N	7718a8b0-03f1-42af-a484-6176f8bf055e
3a2f4951-406c-4c6b-b1d4-98dcada26220	cm7kzddeg0005tiezgu7mny7o	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
34264191-99b1-404e-a53f-b164da760f53	cm7kzdeit001btiez5rw9ebwy	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
1ea8466a-3fce-4737-b0ca-904d5693a552	cm7kzdem2001etiez562qh0av	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
25635863-84ad-4a76-a95a-386f19817901	cm7kzdeoe001htiezrjrt19ky	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
39a5ef2f-a726-4d24-b5f6-286d82142c28	cm7kzdeqs001ktiezz18ojw3u	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
c155ff1b-3dff-4c39-92d4-d9598df3ba3a	cm7kzdet9001ntiezdvpf7vzh	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
57226ed9-ee60-468c-884a-81b33688c8d8	cm7kzdevi001qtiezgj73csub	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
7ec6504c-9ceb-4be0-9c80-9d5868b9fafa	cm7kzddh90008tiezwwcrd3b8	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
d856aa3f-e262-4cd0-a15f-9be65e25fcc3	cm7kzdexv001ttiezd9qp4fnd	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
a09719be-243b-44bd-83e2-ca42ac9dbf56	cm7kzdf0h001wtiezw62tl467	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
7d71a467-a522-4cb1-a995-707a6a0d0950	cm7kzdf2o001ztiezivpdg041	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
530711e3-ae41-48d8-9629-8cb83cb16af2	cm7kzdf510022tiezbd1efwid	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
334b329d-6bb2-48da-af6c-02e90bb1076c	cm7kzdf7q0025tiez3gix3ql8	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
5b20c537-afed-4951-b7d2-f5ac08eb24de	cm7kzdf9v0028tiezbkj6976d	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
34f0a82a-c3c0-4f95-9e29-98c50f5eb49a	cm7kzdfbt002btiez0v85maax	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
3fc50aaf-25f1-48a6-9cbf-59f470d9956d	cm7kzdfdu002etiez52icz8n9	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
2f3d710d-2d82-4c66-9c20-9f12fae18ac3	cm7kzdffv002htiezgs1sdodk	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
6a30113e-29d7-4679-ad6a-728fae2cc735	cm7kzdfht002ktiezl6dnrgr7	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
174c2f0e-05f7-4cd1-bd6d-8f4de2e13f24	cm7kzdfjt002ntiezaqjbtp32	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
820dbaa9-b9b3-469d-9762-b3707cb0b5ea	cm7kzdflr002qtiezov2qisq5	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
970285b3-c2a6-4bd4-87dd-2bdc92e79cc0	cm7kzdfns002ttiez41h7qo5e	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
0d10e2e3-5976-41a8-afaa-cb887bcf7804	cm7kzdfpp002wtiezegshp6z9	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
5a09f75e-39d0-4497-be47-4dfaec842805	cm7kzdfrt002ztiezc5045vpx	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
6622a143-9810-4d3e-b917-19b053a61fba	cm7kzdftu0032tiezk6yg4l3e	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
36aa5030-bfb8-4118-a31c-11be07b11933	cm7kzdfw00035tiezy82xhqru	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
e7df1077-5ea3-440a-a95a-726df989d294	cm7kzdfxy0038tiezpjjkelsl	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
d834ff6f-a2a2-47cf-ad1f-2375597d3ad2	cm7kzdfzw003btiezmybkw0bj	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
c78af478-2fc2-49cb-abb5-0565f507c3c6	cm7kzdg1t003etiez8bn0c7gi	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
9a2f1b34-29fe-4717-99f8-4320d0ad4fca	cm7kzdg3q003htiezu3itd6dy	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
f2e669e6-6284-46d3-99b3-d20cd68a3b90	cm7kzdg5q003ktiez9iv81n5j	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
c1001c77-9029-41d0-a0f4-550e1ad9323e	cm7kzddkr000btiezu82356es	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
62b4214e-cb19-4a50-869a-7096bf63f56f	cm7kzddnc000etiezr7ux0g1r	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
d24b5183-c03e-462a-baa8-b1bde65331e3	cm7kzddpq000htiezgjh0rch1	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
a395b48d-5870-45c5-8672-81f04b07119c	cm7kzdg7q003ntiezau32los1	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
551ef8d3-ab4a-4904-a327-c98ad4e7b0b0	cm7kzdg9r003qtiezxf3io009	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
0c830d49-12b5-4bc9-a7c7-274a63e46c64	cm7kzdgc2003ttiezuq1o94h4	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
46b2074f-f168-481c-a77c-14c395dc2fa9	cm7kzdge0003wtiezc5kktao5	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
dc8e6443-185f-41f0-89ce-9c74f6d327d3	cm7kzdgfx003ztiezku64j528	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
62b75d3e-c46a-42c0-9bec-1bbb4fcb76d5	cm7kzdghy0042tiezq2v888zj	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
a8919113-112e-4be6-9d46-aacf0628e5d1	cm7kzdgjz0045tiez25kdmubr	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
a7f94a1c-9a4d-430c-8c16-18dc65336936	cm7kzdgm00048tiezoivksh7i	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
6d27fbcd-a4df-4b0e-aa78-9b507222adf1	cm7kzdd9b0002tiez8io57mt0	\N	\N	\N	\N	2025-05-15 19:17:11.507	2025-05-15 19:17:11.507	MALE	\N	\N	b4f82f14-79d6-4123-a29b-4d45ff890a52
\.


--
-- Data for Name: AthleteStatusHistory; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."AthleteStatusHistory" (id, "athleteId", "previousClubId", "newClubId", "wasIndividual", "becameIndividual", reason, "paymentId", "createdAt") FROM stdin;
4933caa0-a3dd-42d8-a415-7e82e7d7dd32	55e59c61-1f86-459c-8e06-55fcb115a432	\N	4c832113-1796-418a-b402-723bf88d6b62	f	f	CLUB_CHANGE	\N	2025-04-02 20:57:19.016+00
f6cb08e1-52b5-4151-80a2-63e868650e4c	6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	\N	\N	f	t	CLUB_TO_INDIVIDUAL	632554ef-f6c4-4c4b-852e-df5608fe2a14	2025-04-05 18:37:02.318+00
7acc2dca-a229-4cc1-993a-19781fe1fdd3	temp_457741f4-177b-471a-ae2c-c8320411e33b	\N	4c832113-1796-418a-b402-723bf88d6b62	f	f	CLUB_CHANGE	\N	2025-04-10 13:51:04.509+00
9548bed5-1e97-4124-828e-a17d7bdcdb3b	temp_457741f4-177b-471a-ae2c-c8320411e33b	4c832113-1796-418a-b402-723bf88d6b62	\N	f	t	CLUB_TO_INDIVIDUAL	2ed3b8bc-4b59-4ccf-a01d-4bcaabea2afb	2025-05-16 00:11:32.548+00
\.


--
-- Data for Name: AthletesSectionBanner; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."AthletesSectionBanner" (id, title, subtitle, description, "imageUrl", "ctaText", active, "order", "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
fe690868-981e-4e01-9621-8ea1d663a586	Conheça nossos Atletas	\N	Descubra quem são os Atletas que representam a Federação Goiana de ciclismo	Banner%20conhe%C3%A7a%20atletas/1747322393842-mavbn455dpr.png	Conheça nossos Atletas	t	0	2025-05-15 15:19:54.437	2025-05-15 15:19:54.437	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
\.


--
-- Data for Name: Banner; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Banner" (id, title, image, link, "order", active, "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
a859ff26-af57-4f43-b47e-760e1f01fe12	banner 01	noticias/1747182806891-5ziv0ggi33a.jpg	http://localhost:3000	0	t	2025-05-14 00:33:26.956	2025-05-14 00:33:26.956	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
a0b7643c-3250-4780-af1a-1683bc094056	Banner 02	noticias/1747218529834-yhx7a15f7k.jpg	https://dev.bemai.com.br	1	t	2025-05-14 10:28:50.415	2025-05-14 10:28:50.415	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
\.


--
-- Data for Name: CalendarEvent; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."CalendarEvent" (id, title, description, startdate, enddate, modality, category, city, uf, status, regulationpdf, website, imageurl, highlight, createdat, updatedat, "bannerUrl", "bannerFilename", "bannerTimestamp") FROM stdin;
d2529e1a-5d52-4049-a536-70828b576fc4	Taça Brasil de Cross Country	Uma descrição do evento 	2025-06-21 20:00:00	2025-06-22 23:00:00	MTB	Elite - Junior - Sub 23 - Sub- 30	Goiânia	GO	Confirmado	\N	https://www.instagram.com/fgcgoias	http://localhost:9000/fgc/calendario/dec4fd75-286b-476b-bf9b-5cb26ccfc932.png	t	2025-04-15 21:57:47.393	2025-04-15 21:57:47.393	\N	\N	\N
7703ad39-4eaf-4afa-bff4-6626eef9307b	Campeonato Brasileiro de Ciclismo de Estrada e CRI	Campeonato Brasileiro de Ciclismo de Estrada e CRI Oficiais CBC (Consultar Regulamento do Evento)	2025-07-04 21:00:00	2025-07-06 21:00:00	Ciclismo	Elite - Junior - Sub 23 	São Paulo	SP	Confirmado	\N	https://www.cbc.esp.br/	https://dev.bemai.com.br/api/calendar/image?path=calendario%2F06134cda-1246-48c4-a868-ce56bb78c962.png	f	2025-04-15 22:13:12.806	2025-04-15 22:13:12.806	\N	\N	\N
160c6400-ae67-48ac-9d8d-22ade6ef628f	73ª Volta Ciclística 1º de Maio	73ª Volta Ciclística 1º de Maio Oficiais CBC (Consultar Regulamento do Evento)	2025-04-26 14:00:00	2025-02-26 18:00:00	Ciclismo	Elite - Junior - Sub 23 - Sub- 30	Indaiatuba 	SP	Confirmado	\N	https://www.instagram.com/fgcgoias	http://localhost:9000/fgc/calendario/4a86f1f8-c8a8-4d5a-b168-f896fdbe983f.png	t	2025-04-16 01:22:31.566	2025-04-16 01:22:31.566	/api/banner/calendar/image?path=banners%2Fcalendario%2Fbanner-principal-1747304921243.png&t=1747304921243	banners/calendario/banner-principal-1747304921243.png	1747304921243
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Category" (id, name, slug, description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Champion; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Champion" (id, "athleteId", modality, category, gender, "position", city, team, year, "createdAt") FROM stdin;
\.


--
-- Data for Name: ChampionCategory; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."ChampionCategory" (id, name, "modalityId", description, "createdAt") FROM stdin;
0e9e4f56-e35f-4b7a-8dc1-fb5071d41ba6	Elite	473d9e36-adb4-4945-bf28-2b9ef449b3dd	\N	2025-03-23 15:13:18.549
e0913af5-2f3a-401f-a30c-38c6f0e412f7	JUNIOR	473d9e36-adb4-4945-bf28-2b9ef449b3dd	\N	2025-03-23 15:13:41.056
dc1a13d7-4b56-4196-bdc5-1c886d5dff98	SUB-30	473d9e36-adb4-4945-bf28-2b9ef449b3dd	\N	2025-03-23 15:14:00.878
d233f50a-37f6-486c-af58-bb2fc13ba2f4	SUB-23	473d9e36-adb4-4945-bf28-2b9ef449b3dd	\N	2025-03-23 15:14:16.931
\.


--
-- Data for Name: ChampionEntry; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."ChampionEntry" (id, "athleteId", "modalityId", "categoryId", gender, "position", city, team, "eventId", "createdAt", "updatedAt") FROM stdin;
24f3ed6b-7378-4a35-bbcc-a3e9c9892418	cm7kzdd9b0002tiez8io57mt0	473d9e36-adb4-4945-bf28-2b9ef449b3dd	0e9e4f56-e35f-4b7a-8dc1-fb5071d41ba6	MALE	1	Goiânia	Avulso	event_2025	2025-03-23 15:22:45.162	2025-03-23 15:22:45.162
5c7f4175-59e9-4982-af4b-81949cc236bb	e77ebac8-86e7-4b49-beb4-bfc443695b29	473d9e36-adb4-4945-bf28-2b9ef449b3dd	0e9e4f56-e35f-4b7a-8dc1-fb5071d41ba6	FEMALE	1	Goiânia	Equipe Teste	event_2025	2025-03-23 17:55:26.81	2025-03-29 18:06:51.938
\.


--
-- Data for Name: ChampionModality; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."ChampionModality" (id, name, description, "createdAt") FROM stdin;
473d9e36-adb4-4945-bf28-2b9ef449b3dd	Ciclismo de Estrada	\N	2025-03-23 15:12:09.131
6ada2761-cd6f-4a33-8ab8-6361f4227740	Mountain Bike	\N	2025-03-23 15:12:56.373
\.


--
-- Data for Name: ChampionshipEvent; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."ChampionshipEvent" (id, name, year, description, "createdAt", "updatedAt") FROM stdin;
event_2025	Campeonato Goiano 2025	2025	Campeonato Goiano de Ciclismo 2025	2025-03-23 00:57:16.066	2025-03-23 00:57:16.066
\.


--
-- Data for Name: City; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."City" (id, name, "stateId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Club; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Club" (id, "responsibleName", "clubName", cnpj, address, city, state, "zipCode", phone, email, "paymentStatus", "paymentId", active, "createdAt", "updatedAt") FROM stdin;
4c832113-1796-418a-b402-723bf88d6b62	Weberty Gerolineto	Clube Ciclismo Teste	12630858000119	Rua Coelho Neto	Goiânia	GO	74360290	62994242329	w.betofoto@hotmail.com	CONFIRMED	f9eb53fb-ab63-40fc-bb62-841cb8ddada5	t	2025-03-30 19:54:56.203	2025-04-02 20:28:06.386
f7335e49-b64c-496d-ae10-36396b549e28	Weberty Gerolineto	Equipe Teste	00.000.000/0000-00	Rua J62	Goiânia	GO	74674-280	(62) 99424-2329	betofoto1@gmail.com	PENDING	\N	t	2025-05-16 21:20:10.42	2025-05-16 21:20:10.42
\.


--
-- Data for Name: ClubFeeSettings; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."ClubFeeSettings" (id, "newRegistrationFee", "annualRenewalFee", active, "createdAt", "updatedAt") FROM stdin;
default-club-fee-settings	200.00	150.00	f	2025-03-30 18:45:58.043	2025-03-30 19:58:27.429
06a08629-849a-41e8-ba85-3b409200c3e9	100.00	80.00	t	2025-03-30 19:58:27.687	2025-03-30 19:58:27.686
\.


--
-- Data for Name: Country; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Country" (id, name, code, "createdAt", "updatedAt") FROM stdin;
BR	Brasil	BR	2025-03-10 16:48:48.366	2025-03-10 16:48:48.366
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Document" (id, title, description, "fileUrl", category, downloads, active, "createdAt", "updatedAt", "createdBy", "fileName", "fileSize", "mimeType") FROM stdin;
760260eb-86c4-49d3-b4d8-7a2a924bc3e9	Documento de Teste	Apenas um documento de teste	documentos/1743188606042-PDF-teste.pdf	GERAL	2	f	2025-03-28 19:03:26.076	2025-03-28 19:03:26.075	5fa9fec3-1936-431d-bbac-faf36c62c043	PDF-teste.pdf	90094	application/pdf
cm7jgj5960001uwkwki0rru3q	cnpj	\N	documentos/1740425710612-3_-_CNPJ_PLANETA_PEDAL_-_RECENTE_2021.pdf	GERAL	13	f	2025-02-24 19:35:10.769	2025-02-24 19:45:29.88	5fa9fec3-1936-431d-bbac-faf36c62c043	3 - CNPJ PLANETA PEDAL - RECENTE 2021.pdf	298412	application/pdf
33d6eb34-cee9-44ee-8876-98d38c62cfc2	CNPJ Planeta Pedal	Cnpj Planeta Pedal	documentos/1747232357708-1740425710612-3_-_CNPJ_PLANETA_PEDAL_-_RECENTE_2021.pdf	GERAL	0	t	2025-05-14 14:19:17.729	2025-05-14 14:19:17.727	5fa9fec3-1936-431d-bbac-faf36c62c043	1740425710612-3_-_CNPJ_PLANETA_PEDAL_-_RECENTE_2021.pdf	298412	application/pdf
4d8366c1-e099-4e00-bf4f-3825e90d4382	Documento de Teste	Só um documento de teste	documentos/1747232275021-1743188274939-PDF-teste.pdf	GERAL	1	t	2025-05-14 14:17:55.046	2025-05-14 14:17:55.045	5fa9fec3-1936-431d-bbac-faf36c62c043	1743188274939-PDF-teste.pdf	90094	application/pdf
\.


--
-- Data for Name: EmailVerification; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."EmailVerification" (id, "userId", token, "expiresAt", "createdAt", "updatedAt") FROM stdin;
cecfd04d-7f25-4010-93fd-9124ce377670	d4640bff-d16b-475d-b9a3-3fe4b93e1779	836cf5bdf62f233a9071f364cbc82ce89a5e348b28eccaf271e852d364ae23d5	2025-05-22 17:03:13.731	2025-05-21 17:03:13.739	2025-05-21 17:03:13.739
\.


--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Event" (id, title, description, location, "startDate", "endDate", published, "coverImage", "organizerId", "createdAt", "updatedAt", "publishedAt", "posterImage", modality, category, gender, "isFree", "maxParticipants", "registrationEnd", status, "modalityId", "categoryId", "countryId", "stateId", "cityId", "addressDetails", "zipCode", latitude, longitude, "regulationPdf", slug, "locationUrl", "resultsFile") FROM stdin;
a8f6cfb3-9fc8-4f04-89f9-63bd217c8e34	WHOOP UCI Mountain Bike World Series em 2025	Depois de explodir no circuito WHOOP UCI Mountain Bike World Series em 2024, o local brasileiro retorna para começar a temporada de 2025, hospedando não uma, mas duas rodadas consecutivas da Copa do Mundo da UCI Cross-country Olympic (XCO) e Short Track (XCC)	Grande Hotel Termas de Araxá	2025-04-10 00:00:00	2025-04-12 00:00:00	t	http://localhost:9000/fgc/eventos/cover/Captura de tela de 2025-03-31 11-57-31.png	5fa9fec3-1936-431d-bbac-faf36c62c043	2025-03-31 15:15:16.465	2025-03-31 15:15:16.465	\N	http://localhost:9000/fgc/eventos/poster/Captura de tela de 2025-03-31 11-54-57.png	\N	\N	BOTH	t	\N	2025-04-11 00:00:00	PUBLISHED	\N	\N	BR	\N	\N	Avenida do Contorno, Barreiro	38184-529	-19.583331	-46.916639	http://localhost:9000/fgc/regulamentos/1743434105252-uyi7c0vpw1.pdf	whoop-uci-mountain-bike-world-series-em-2025	\N	\N
3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Evento Teste Gratuito	Apenas um Evento teste gratuito	Goiania	2025-03-29 00:00:00	2025-03-29 00:00:00	t	http://localhost:9000/fgc/eventos/cover/Captura de tela 2025-03-20 150655.jpg	5fa9fec3-1936-431d-bbac-faf36c62c043	2025-03-21 13:19:20.464	2025-04-11 01:18:54.719	\N	http://localhost:9000/fgc/eventos/poster/Captura de tela 2025-03-20 150655.png	\N	\N	BOTH	t	\N	2025-03-25 00:00:00	PUBLISHED	\N	\N	BR	\N	\N	Rua D 34, Setor Novo Horizonte	74363-750	\N	\N	http://localhost:9000/fgc/regulamentos/1742563157458-yvjpeduaf9q.pdf	evento-teste-gratuito	\N	http://localhost:9000/fgc/resultados/1744334332726-dl68ost48.csv
6bc32f74-3a69-4aa8-a0d0-b885f2741378	2025 UCI GRAN FONDO WORLD SERIES BRASIL	SOBRE O EVENTO\nUm verdadeiro marco para o Brasil e especialmente para o Vale Europeu Catarinense .Mais de 20 países por temporada, 60.000 participantes em 5 continentes.\nMais de 2 mil atletas ja participaram conosco em 2 edições, 2023 e 2024. Um evento que reúne ciclistas profissionais e amadores desfrutando de um percurso incrível pelo Vale Europeu Catarinense com Largada e Chegada no Centro Histórico de Pomerode.SC.\nTrazemos ao Brasil o UCI Gran Fondo World Series com chancela oficial UCI onde a proposta segue o padrão mundial de organização em uma prova de CICLISMO DE ESTRADA CLÁSSICO.	Estacionamento do Flamboyant Shopping Center	2025-04-26 00:00:00	2025-04-26 00:00:00	t	http://localhost:9000/fgc/eventos/cover/Captura de tela de 2025-04-12 17-28-52.png	5fa9fec3-1936-431d-bbac-faf36c62c043	2025-04-12 21:03:59.24	2025-04-15 11:23:44.754	\N	http://localhost:9000/fgc/eventos/poster/Captura de tela de 2025-04-12 17-28-52.png	\N	\N	BOTH	f	\N	2025-04-23 00:00:00	PUBLISHED	\N	\N	BR	\N	\N	Avenida Deputado Jamel Cecílio, Jardim Goiás	74810-907	\N	\N	\N	2025-uci-gran-fondo-world-series-brasil	https://www.google.com/maps/search/flamboyant/@-16.7102509,-49.2370077,13z?entry=ttu&g_ep=EgoyMDI1MDQwOS4wIKXMDSoJLDEwMjExNDU1SAFQAw%3D%3D	
430a1b6e-a874-43a4-94f5-f9140d41e899	L'ÉTAPE RIO DE JANEIRO BY TOUR DE FRANCE PRESENTED BY NUBANK - 2025	O EVENTO\nO L’ÉTAPE RIO by TOUR DE FRANCE presented by NUBANK é um evento de ciclismo amador, cujo objetivo é aproximar os participantes da experiência da maior competição de ciclismo do mundo, o TOUR DE FRANCE.	Av. Infante Dom Henrique, S/N - Glória, Rio de Janeiro - RJ, 20021-140	2025-04-26 00:00:00	2025-04-26 00:00:00	t	http://localhost:9000/fgc/eventos/cover/Captura de tela de 2025-04-13 11-50-06.png	5fa9fec3-1936-431d-bbac-faf36c62c043	2025-04-14 18:07:31.685	2025-04-14 22:52:27.825	\N	http://localhost:9000/fgc/eventos/poster/Captura de tela de 2025-04-13 11-50-06.png	\N	\N	BOTH	f	\N	2025-04-24 00:00:00	PUBLISHED	\N	\N	\N	\N	\N	Avenida Infante Dom Henrique, Glória	20021-140	\N	\N	http://localhost:9000/fgc/regulamentos/1744653664864-cq9z0dgulzs.pdf	ltape-rio-de-janeiro-by-tour-de-france-presented-by-nubank-2025	https://www.google.com/maps/place/BR+Marinas+-+Marina+da+Gl%C3%B3ria/@-22.9198897,-43.1700844,17z/data=!3m1!4b1!4m6!3m5!1s0x9981c4aaaf0d3b:0xf1f26312e97db447!8m2!3d-22.9198897!4d-43.1700844!16s%2Fm%2F02w9gw7?entry=ttu&g_ep=EgoyMDI1MDQwOS4wIKXMDSoJLDEwMjExNDU1SAFQAw%3D%3D	
d8b98cd4-16f5-4845-b344-d413dfe5f2db	Taça Brasil de Cross Country	Taça Brasil de XCO cross conuntry 2025	Parque do Cerrado - Prefeitura de Goiânia	2025-10-20 00:00:00	2025-10-22 00:00:00	t	https://dev.bemai.com.br/api/events/image?path=eventos%2F1747221380965-oszpie1inmi.jpg&type=cover	5fa9fec3-1936-431d-bbac-faf36c62c043	2025-05-14 11:17:33.513	2025-05-14 11:17:33.513	\N	https://dev.bemai.com.br/api/events/image?path=eventos%2F1747221423217-4tcx2r6rpv.jpg&type=poster	\N	\N	BOTH	f	\N	2025-10-17 00:00:00	PUBLISHED	\N	\N	\N	\N	\N	Avenida PL 2, Park Lozandes	74884-110	\N	\N	https://dev.bemai.com.br/api/events/regulation?path=eventos%2Fregulamentos%2F1747221446623-ijqucnoxco.pdf	taca-brasil-de-cross-country	https://www.google.com/maps/search/parque+do+cerrado/@-16.703944,-49.2238998,34627m/data=!3m1!1e3?entry=ttu&g_ep=EgoyMDI1MDUxMS4wIKXMDSoJLDEwMjExNDUzSAFQAw%3D%3D	
\.


--
-- Data for Name: EventCategory; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."EventCategory" (id, name, description, active, "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
3524e809-1524-4219-81dd-5a6459aa1894	JUNIOR	Categoria junior	t	2025-04-06 01:42:42.395	2025-04-06 01:42:42.391	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
4e681273-544f-46ef-8105-9c33c3fac95e	SUB-23	Categoria SUB-23	t	2025-04-06 01:43:25.56	2025-04-06 01:43:25.557	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
8ee4e740-3226-4608-8611-0932066baee1	SUB-30	Categoria SUB-30	t	2025-04-06 01:44:00.951	2025-04-06 01:44:00.948	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
fa06f64e-bf02-4fb9-8afa-5da62f49fb03	ESPECIAL	Categoria especial BMX	t	2025-04-06 01:45:02.907	2025-04-06 01:45:02.903	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7roxtzq0011kja8s7xxmq2n	ELITE	Categoria elite	t	2025-03-02 13:52:42.519	2025-04-06 01:42:14.232	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
e9fb334c-f044-4cd0-818f-0a82f698c0ad	Master A	Categoria Master A	t	2025-05-14 10:58:36.328	2025-05-14 16:05:48.616	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
\.


--
-- Data for Name: EventCategory_backup; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."EventCategory_backup" (id, name, description, "modalityId", active, "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
cm7rosyoo000bkja87ew2cwg2	SUB-23	categoria ciclismo speed	cm7ro2ao80001kja8o4jdj323	t	2025-03-02 13:48:55.321	2025-03-02 13:48:55.321	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rot847000dkja8hjl2j5ek	SUB-30	categoria ciclismo speed	cm7ro2ao80001kja8o4jdj323	t	2025-03-02 13:49:07.544	2025-03-02 13:49:07.544	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rotj8n000fkja8l6qwex9c	JUNIOR	categoria ciclismo speed	cm7ro2ao80001kja8o4jdj323	t	2025-03-02 13:49:21.959	2025-03-02 13:49:21.959	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rott00000hkja86le79137	JUVENIL	categoria ciclismo speed	cm7ro2ao80001kja8o4jdj323	t	2025-03-02 13:49:34.609	2025-03-02 13:49:34.609	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rou3gp000jkja8eysbyzc3	INFANTOJUVENIL	categoria ciclismo speed	cm7ro2ao80001kja8o4jdj323	t	2025-03-02 13:49:48.169	2025-03-02 13:49:48.169	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rougbp000lkja8b7z3cj5y	MASTER A1	categoria ciclismo speed	cm7ro2ao80001kja8o4jdj323	t	2025-03-02 13:50:04.838	2025-03-02 13:50:04.838	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rouqtq000nkja8mzn9obb0	MASTER A2	categoria ciclismo speed	cm7ro2ao80001kja8o4jdj323	t	2025-03-02 13:50:18.446	2025-03-02 13:50:18.446	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rouyfw000pkja88kvol8z3	MASTER B1	categoria ciclismo speed	cm7ro2ao80001kja8o4jdj323	t	2025-03-02 13:50:28.317	2025-03-02 13:50:28.317	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rovb2r000rkja8ejkgtxpt	MASTER B2	categoria ciclismo speed	cm7ro2ao80001kja8o4jdj323	t	2025-03-02 13:50:44.692	2025-03-02 13:50:44.692	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rovn1x000tkja8xfaqqth2	MASTER C1	categoria ciclismo speed	cm7ro2ao80001kja8o4jdj323	t	2025-03-02 13:51:00.214	2025-03-02 13:51:00.214	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rovzbp000vkja89ux363pr	MASTER C2	categoria ciclismo speed	cm7ro2ao80001kja8o4jdj323	t	2025-03-02 13:51:16.117	2025-03-02 13:51:16.117	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7row70n000xkja81kz7a60k	MASTER D1	categoria ciclismo speed	cm7ro2ao80001kja8o4jdj323	t	2025-03-02 13:51:26.087	2025-03-02 13:51:26.087	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rowhwt000zkja876n8i7yf	MASTER D2	categoria ciclismo speed	cm7ro2ao80001kja8o4jdj323	t	2025-03-02 13:51:40.205	2025-03-02 13:51:40.205	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7roxtzq0011kja8s7xxmq2n	ELITE	categoria MTB	cm7roc93s0002kja8p293o507	t	2025-03-02 13:52:42.519	2025-03-02 13:52:42.519	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7royfbx0013kja8gvho2h9q	SUB-23	categoria MTB	cm7roc93s0002kja8p293o507	t	2025-03-02 13:53:10.173	2025-03-02 13:53:10.173	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7royptz0015kja873unns8h	SUB-30	categoria MTB	cm7roc93s0002kja8p293o507	t	2025-03-02 13:53:23.783	2025-03-02 13:53:23.783	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7royyml0017kja8mq29m51d	JUNIOR	categoria MTB	cm7roc93s0002kja8p293o507	t	2025-03-02 13:53:35.182	2025-03-02 13:53:35.182	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7roz6ts0019kja87dvw52z6	JUVENIL	categoria MTB	cm7roc93s0002kja8p293o507	t	2025-03-02 13:53:45.808	2025-03-02 13:53:45.808	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7roze9n001bkja8acp73rla	INFANTOJUVENIL	categoria MTB	cm7roc93s0002kja8p293o507	t	2025-03-02 13:53:55.451	2025-03-02 13:53:55.451	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rozpt0001dkja8xwj9pz3t	MASTER A1	categoria MTB	cm7roc93s0002kja8p293o507	t	2025-03-02 13:54:10.404	2025-03-02 13:54:10.404	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rozxdt001fkja85fwmw6rt	MASTER A2	categoria MTB	cm7roc93s0002kja8p293o507	t	2025-03-02 13:54:20.225	2025-03-02 13:54:20.225	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rp048e001hkja8vroa1n5u	MASTER B1	categoria MTB	cm7roc93s0002kja8p293o507	t	2025-03-02 13:54:29.103	2025-03-02 13:54:29.103	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rp0cxh001jkja826fhl0x7	MASTER B2	categoria MTB	cm7roc93s0002kja8p293o507	t	2025-03-02 13:54:40.373	2025-03-02 13:54:40.373	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rp0ik2001lkja8dp1tbtvy	MASTER C1	categoria MTB	cm7roc93s0002kja8p293o507	t	2025-03-02 13:54:47.667	2025-03-02 13:54:47.667	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rp0oo7001nkja86gxix7y5	MASTER C2	categoria MTB	cm7roc93s0002kja8p293o507	t	2025-03-02 13:54:55.591	2025-03-02 13:54:55.591	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rp0ycr001pkja8w51zqxjr	MASTER D1	categoria MTB	cm7roc93s0002kja8p293o507	t	2025-03-02 13:55:08.14	2025-03-02 13:55:08.14	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rp18tl001rkja89pu01awm	MASTER D2	categoria MTB	cm7roc93s0002kja8p293o507	t	2025-03-02 13:55:21.705	2025-03-02 13:55:21.705	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rosfmk0009kja876mny3kr	ELITE	categoria ciclismo speed	cm7roc93s0002kja8p293o507	t	2025-03-02 13:48:30.621	2025-04-05 21:25:37.345	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
\.


--
-- Data for Name: EventCouponUsage; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."EventCouponUsage" (id, "couponId", "registrationId", "discountAmount", "createdAt") FROM stdin;
\.


--
-- Data for Name: EventDiscountCoupon; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."EventDiscountCoupon" (id, "eventId", code, discount, "modalityId", "categoryId", "genderId", "maxUses", "usedCount", active, "startDate", "endDate", "createdAt", "updatedAt") FROM stdin;
430a1b6e-a874-43a4-94f5-f9140d41e899-PROMOSUB30	430a1b6e-a874-43a4-94f5-f9140d41e899	PROMOSUB30	10.00	cm7ro2ao80001kja8o4jdj323	8ee4e740-3226-4608-8611-0932066baee1	\N	10	0	t	2025-04-14 03:00:00	2025-04-17 03:00:00	2025-04-14 23:04:43.351	2025-04-14 23:04:43.351
dc660345-1d9e-4ab0-8929-2b6c03cd7f7b	d8b98cd4-16f5-4845-b344-d413dfe5f2db	PROMOELITE	10.00	cm7roc93s0002kja8p293o507	cm7roxtzq0011kja8s7xxmq2n	\N	10	0	t	2025-05-14 11:08:35.487	2025-06-13 11:08:35.487	2025-05-14 11:17:33.513	2025-05-14 11:17:33.513
4d8a1d1e-b2d8-48fa-b67a-0f23112484dd	d8b98cd4-16f5-4845-b344-d413dfe5f2db	PROMOSUB30	10.00	cm7roc93s0002kja8p293o507	8ee4e740-3226-4608-8611-0932066baee1	\N	10	0	t	2025-05-14 11:14:15.493	2025-06-13 03:00:00	2025-05-14 11:17:33.513	2025-05-14 11:17:33.513
0f245a43-cb30-40df-a8a3-93cd11bcafad	d8b98cd4-16f5-4845-b344-d413dfe5f2db	PROMOMA	10.00	cm7roc93s0002kja8p293o507	e9fb334c-f044-4cd0-818f-0a82f698c0ad	\N	10	0	t	2025-05-14 11:14:58.655	2025-06-13 03:00:00	2025-05-14 11:17:33.513	2025-05-14 11:17:33.513
\.


--
-- Data for Name: EventModality; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."EventModality" (id, name, description, active, "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
cm7ro2ao80001kja8o4jdj323	Ciclismo de Estrada	Modalidade de Ciclismo Speed	t	2025-03-02 13:28:11.102	2025-03-02 13:28:26.734	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7roc93s0002kja8p293o507	Mountain Bike	Modalidade de MTB	t	2025-03-02 13:35:55.671	2025-03-02 13:35:55.671	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rod87g0003kja83a2xjgwv	BMX Racing	Modalidade de BMX Racing	t	2025-03-02 13:36:41.164	2025-03-02 13:36:41.164	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
\.


--
-- Data for Name: EventModalityToCategory; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."EventModalityToCategory" ("modalityId", "categoryId", "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
cm7roc93s0002kja8p293o507	cm7roxtzq0011kja8s7xxmq2n	2025-04-06 01:42:14.241	2025-04-06 01:42:14.232	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7ro2ao80001kja8o4jdj323	cm7roxtzq0011kja8s7xxmq2n	2025-04-06 01:42:14.244	2025-04-06 01:42:14.232	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rod87g0003kja83a2xjgwv	cm7roxtzq0011kja8s7xxmq2n	2025-04-06 01:42:14.247	2025-04-06 01:42:14.232	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7roc93s0002kja8p293o507	3524e809-1524-4219-81dd-5a6459aa1894	2025-04-06 01:42:42.401	2025-04-06 01:42:42.391	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7ro2ao80001kja8o4jdj323	3524e809-1524-4219-81dd-5a6459aa1894	2025-04-06 01:42:42.404	2025-04-06 01:42:42.391	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rod87g0003kja83a2xjgwv	3524e809-1524-4219-81dd-5a6459aa1894	2025-04-06 01:42:42.406	2025-04-06 01:42:42.391	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7roc93s0002kja8p293o507	4e681273-544f-46ef-8105-9c33c3fac95e	2025-04-06 01:43:25.563	2025-04-06 01:43:25.557	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7ro2ao80001kja8o4jdj323	4e681273-544f-46ef-8105-9c33c3fac95e	2025-04-06 01:43:25.569	2025-04-06 01:43:25.557	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7roc93s0002kja8p293o507	8ee4e740-3226-4608-8611-0932066baee1	2025-04-06 01:44:00.954	2025-04-06 01:44:00.948	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7ro2ao80001kja8o4jdj323	8ee4e740-3226-4608-8611-0932066baee1	2025-04-06 01:44:00.957	2025-04-06 01:44:00.948	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7rod87g0003kja83a2xjgwv	fa06f64e-bf02-4fb9-8afa-5da62f49fb03	2025-04-06 01:45:02.91	2025-04-06 01:45:02.903	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7roc93s0002kja8p293o507	e9fb334c-f044-4cd0-818f-0a82f698c0ad	2025-05-14 16:05:48.628	2025-05-14 16:05:48.616	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
cm7ro2ao80001kja8o4jdj323	e9fb334c-f044-4cd0-818f-0a82f698c0ad	2025-05-14 16:05:48.632	2025-05-14 16:05:48.616	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
\.


--
-- Data for Name: EventPricingByCategory; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."EventPricingByCategory" (id, "eventId", "modalityId", "categoryId", "genderId", price, "tierId", "createdAt", "updatedAt") FROM stdin;
23ca360b-0c57-4aa7-9969-5ae26e2e2068	430a1b6e-a874-43a4-94f5-f9140d41e899	cm7ro2ao80001kja8o4jdj323	4e681273-544f-46ef-8105-9c33c3fac95e	b4f82f14-79d6-4123-a29b-4d45ff890a52	70.00	0edf2c57-ca41-4a24-ada7-aeef0c68aa84	2025-04-14 22:52:27.825	2025-04-14 22:52:27.825
89d87c7e-1181-41b6-963d-b56f7ba56679	430a1b6e-a874-43a4-94f5-f9140d41e899	cm7ro2ao80001kja8o4jdj323	4e681273-544f-46ef-8105-9c33c3fac95e	7718a8b0-03f1-42af-a484-6176f8bf055e	60.00	0edf2c57-ca41-4a24-ada7-aeef0c68aa84	2025-04-14 22:52:27.825	2025-04-14 22:52:27.825
3e9e241b-72ba-49da-98f3-b4e30cc1ba71	d8b98cd4-16f5-4845-b344-d413dfe5f2db	cm7roc93s0002kja8p293o507	3524e809-1524-4219-81dd-5a6459aa1894	7718a8b0-03f1-42af-a484-6176f8bf055e	180.00	temp-1747220911560	2025-05-14 11:17:33.513	2025-05-14 11:17:33.513
d17353a4-72ee-4f4f-9239-f84411c59a3f	d8b98cd4-16f5-4845-b344-d413dfe5f2db	cm7roc93s0002kja8p293o507	3524e809-1524-4219-81dd-5a6459aa1894	b4f82f14-79d6-4123-a29b-4d45ff890a52	180.00	temp-1747220911560	2025-05-14 11:17:33.513	2025-05-14 11:17:33.513
a58d5c5f-ef11-45b2-b600-58f1a21227a2	d8b98cd4-16f5-4845-b344-d413dfe5f2db	cm7roc93s0002kja8p293o507	4e681273-544f-46ef-8105-9c33c3fac95e	7718a8b0-03f1-42af-a484-6176f8bf055e	200.00	temp-1747220911560	2025-05-14 11:17:33.513	2025-05-14 11:17:33.513
c82a860f-2113-40cb-b5f9-339ef6b8e9ee	d8b98cd4-16f5-4845-b344-d413dfe5f2db	cm7roc93s0002kja8p293o507	4e681273-544f-46ef-8105-9c33c3fac95e	b4f82f14-79d6-4123-a29b-4d45ff890a52	200.00	temp-1747220911560	2025-05-14 11:17:33.513	2025-05-14 11:17:33.513
\.


--
-- Data for Name: EventPricingTier; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."EventPricingTier" (id, name, description, price, "startDate", "endDate", "maxEntries", active, "eventId", "createdAt", "updatedAt", "endTime") FROM stdin;
0edf2c57-ca41-4a24-ada7-aeef0c68aa84	Lote Teste		100.00	2025-04-14 20:31:02.993	2025-05-14 20:31:02.993	100	t	430a1b6e-a874-43a4-94f5-f9140d41e899	2025-04-14 22:52:27.825	2025-04-14 22:52:27.825	\N
6bc32f74-3a69-4aa8-a0d0-b885f2741378-1744506339543-335	Primeiro Lote		100.00	2025-04-12 03:00:00	2025-04-16 03:00:00	100	t	6bc32f74-3a69-4aa8-a0d0-b885f2741378	2025-04-15 11:23:44.754	2025-04-15 11:23:44.754	\N
temp-1747220911560	Primeiro Lote	Primeiro Lote	220.00	2025-05-14 03:00:00	2025-10-17 03:00:00	700	t	d8b98cd4-16f5-4845-b344-d413dfe5f2db	2025-05-14 11:17:33.513	2025-05-14 11:17:33.513	\N
\.


--
-- Data for Name: EventToCategory; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."EventToCategory" (id, "eventId", "categoryId", "createdAt") FROM stdin;
d0a7b2d5-200d-4d8a-beb3-69103aea7d74	a8f6cfb3-9fc8-4f04-89f9-63bd217c8e34	cm7roxtzq0011kja8s7xxmq2n	2025-03-31 15:15:16.465
82640fa9-6f95-48cb-96ab-8739c03620e7	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	3524e809-1524-4219-81dd-5a6459aa1894	2025-04-10 18:35:34.729
934c86e2-a6f1-4045-8da3-cb5665a74c68	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	4e681273-544f-46ef-8105-9c33c3fac95e	2025-04-10 18:35:34.741
45888116-9440-4699-ac51-3294d488f3c5	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	8ee4e740-3226-4608-8611-0932066baee1	2025-04-10 18:35:34.745
430a1b6e-a874-43a4-94f5-f9140d41e899-cm7roxtzq0011kja8s7xxmq2n	430a1b6e-a874-43a4-94f5-f9140d41e899	cm7roxtzq0011kja8s7xxmq2n	2025-04-14 22:52:27.825
430a1b6e-a874-43a4-94f5-f9140d41e899-3524e809-1524-4219-81dd-5a6459aa1894	430a1b6e-a874-43a4-94f5-f9140d41e899	3524e809-1524-4219-81dd-5a6459aa1894	2025-04-14 22:52:27.825
430a1b6e-a874-43a4-94f5-f9140d41e899-4e681273-544f-46ef-8105-9c33c3fac95e	430a1b6e-a874-43a4-94f5-f9140d41e899	4e681273-544f-46ef-8105-9c33c3fac95e	2025-04-14 22:52:27.825
430a1b6e-a874-43a4-94f5-f9140d41e899-8ee4e740-3226-4608-8611-0932066baee1	430a1b6e-a874-43a4-94f5-f9140d41e899	8ee4e740-3226-4608-8611-0932066baee1	2025-04-14 22:52:27.825
6bc32f74-3a69-4aa8-a0d0-b885f2741378-cm7roxtzq0011kja8s7xxmq2n	6bc32f74-3a69-4aa8-a0d0-b885f2741378	cm7roxtzq0011kja8s7xxmq2n	2025-04-15 11:23:44.754
6bc32f74-3a69-4aa8-a0d0-b885f2741378-3524e809-1524-4219-81dd-5a6459aa1894	6bc32f74-3a69-4aa8-a0d0-b885f2741378	3524e809-1524-4219-81dd-5a6459aa1894	2025-04-15 11:23:44.754
6bc32f74-3a69-4aa8-a0d0-b885f2741378-4e681273-544f-46ef-8105-9c33c3fac95e	6bc32f74-3a69-4aa8-a0d0-b885f2741378	4e681273-544f-46ef-8105-9c33c3fac95e	2025-04-15 11:23:44.754
6bc32f74-3a69-4aa8-a0d0-b885f2741378-8ee4e740-3226-4608-8611-0932066baee1	6bc32f74-3a69-4aa8-a0d0-b885f2741378	8ee4e740-3226-4608-8611-0932066baee1	2025-04-15 11:23:44.754
0ba92583-f235-4e02-ab4e-1f59ad50deb2	d8b98cd4-16f5-4845-b344-d413dfe5f2db	8ee4e740-3226-4608-8611-0932066baee1	2025-05-14 11:17:33.513
579d115d-746b-4c39-8f48-470557e2f283	d8b98cd4-16f5-4845-b344-d413dfe5f2db	4e681273-544f-46ef-8105-9c33c3fac95e	2025-05-14 11:17:33.513
2d548053-f6fe-44ef-9954-b005fcef2140	d8b98cd4-16f5-4845-b344-d413dfe5f2db	3524e809-1524-4219-81dd-5a6459aa1894	2025-05-14 11:17:33.513
02324cf1-9d03-4727-a5ad-a24f5c16d39e	d8b98cd4-16f5-4845-b344-d413dfe5f2db	cm7roxtzq0011kja8s7xxmq2n	2025-05-14 11:17:33.513
\.


--
-- Data for Name: EventToGender; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."EventToGender" (id, "eventId", "genderId", "createdAt") FROM stdin;
3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6-b4f82f14-79d6-4123-a29b-4d45ff890a52	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	b4f82f14-79d6-4123-a29b-4d45ff890a52	2025-03-28 21:13:06.224
3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6-7718a8b0-03f1-42af-a484-6176f8bf055e	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	7718a8b0-03f1-42af-a484-6176f8bf055e	2025-03-28 21:13:06.224
0187a8fd-b489-43cd-9b19-5c3381f243d5	a8f6cfb3-9fc8-4f04-89f9-63bd217c8e34	b4f82f14-79d6-4123-a29b-4d45ff890a52	2025-03-31 15:15:16.465
ef262d19-ecc7-43e6-a759-7083770dcb69	a8f6cfb3-9fc8-4f04-89f9-63bd217c8e34	7718a8b0-03f1-42af-a484-6176f8bf055e	2025-03-31 15:15:16.465
430a1b6e-a874-43a4-94f5-f9140d41e899-b4f82f14-79d6-4123-a29b-4d45ff890a52	430a1b6e-a874-43a4-94f5-f9140d41e899	b4f82f14-79d6-4123-a29b-4d45ff890a52	2025-04-14 22:52:27.825
430a1b6e-a874-43a4-94f5-f9140d41e899-7718a8b0-03f1-42af-a484-6176f8bf055e	430a1b6e-a874-43a4-94f5-f9140d41e899	7718a8b0-03f1-42af-a484-6176f8bf055e	2025-04-14 22:52:27.825
6bc32f74-3a69-4aa8-a0d0-b885f2741378-b4f82f14-79d6-4123-a29b-4d45ff890a52	6bc32f74-3a69-4aa8-a0d0-b885f2741378	b4f82f14-79d6-4123-a29b-4d45ff890a52	2025-04-15 11:23:44.754
6bc32f74-3a69-4aa8-a0d0-b885f2741378-7718a8b0-03f1-42af-a484-6176f8bf055e	6bc32f74-3a69-4aa8-a0d0-b885f2741378	7718a8b0-03f1-42af-a484-6176f8bf055e	2025-04-15 11:23:44.754
cb83ae17-f1bb-498c-8812-3ef88fca67ed	d8b98cd4-16f5-4845-b344-d413dfe5f2db	b4f82f14-79d6-4123-a29b-4d45ff890a52	2025-05-14 11:17:33.513
931541b0-c4e1-4efb-8fd8-046df798da55	d8b98cd4-16f5-4845-b344-d413dfe5f2db	7718a8b0-03f1-42af-a484-6176f8bf055e	2025-05-14 11:17:33.513
\.


--
-- Data for Name: EventToModality; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."EventToModality" (id, "eventId", "modalityId", "createdAt") FROM stdin;
3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6-cm7ro2ao80001kja8o4jdj323	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	cm7ro2ao80001kja8o4jdj323	2025-03-28 21:13:06.224
f20abbe2-887a-449b-bead-549ec443caf4	a8f6cfb3-9fc8-4f04-89f9-63bd217c8e34	cm7roc93s0002kja8p293o507	2025-03-31 15:15:16.465
430a1b6e-a874-43a4-94f5-f9140d41e899-cm7ro2ao80001kja8o4jdj323	430a1b6e-a874-43a4-94f5-f9140d41e899	cm7ro2ao80001kja8o4jdj323	2025-04-14 22:52:27.825
6bc32f74-3a69-4aa8-a0d0-b885f2741378-cm7ro2ao80001kja8o4jdj323	6bc32f74-3a69-4aa8-a0d0-b885f2741378	cm7ro2ao80001kja8o4jdj323	2025-04-15 11:23:44.754
c29edffb-8cb4-4789-aa84-e10f4eedc6bb	d8b98cd4-16f5-4845-b344-d413dfe5f2db	cm7roc93s0002kja8p293o507	2025-05-14 11:17:33.513
\.


--
-- Data for Name: EventTopResult; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."EventTopResult" (id, "eventId", "categoryId", "position", "userId", "athleteName", "clubId", "clubName", result, "createdAt", "updatedAt") FROM stdin;
221db510-a702-4409-b7b9-af3a244f6c4c	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	3524e809-1524-4219-81dd-5a6459aa1894	1	\N	João Silva	\N	Clube Ciclismo Goiânia	00:45.425	2025-04-11 01:18:56.342	2025-04-11 01:18:56.342
fa22b075-350c-4bf6-a3b0-abdb2ef0f5d2	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	3524e809-1524-4219-81dd-5a6459aa1894	2	\N	Pedro Almeida	\N	Pedal Livre	00:46.089	2025-04-11 01:18:56.355	2025-04-11 01:18:56.355
09ba36c0-20ed-4ef1-b533-fbfb7a1bc94e	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	3524e809-1524-4219-81dd-5a6459aa1894	3	\N	Lucas Oliveira	\N	Ciclistas Unidos	00:47.350	2025-04-11 01:18:56.361	2025-04-11 01:18:56.361
cca7ab90-f6fe-447a-9a02-e467b5e54206	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	3524e809-1524-4219-81dd-5a6459aa1894	4	\N	Gabriel Santos	\N	Bike Club	00:48.969	2025-04-11 01:18:56.369	2025-04-11 01:18:56.369
0d6e79d8-f3b7-4769-b37c-6e6ad514850c	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	3524e809-1524-4219-81dd-5a6459aa1894	5	\N	Matheus Costa	\N	Pedalada Radical	00:49.181	2025-04-11 01:18:56.373	2025-04-11 01:18:56.373
197e5d53-5c89-47eb-932a-845d64541fdc	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	4e681273-544f-46ef-8105-9c33c3fac95e	1	\N	Ana Carolina	\N	Clube Ciclismo Goiânia	00:42.841	2025-04-11 01:18:56.378	2025-04-11 01:18:56.378
099504fa-ac14-42b7-b02a-ad1dad93e86c	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	4e681273-544f-46ef-8105-9c33c3fac95e	2	\N	Mariana Ferreira	\N	Pedal Livre	00:43.567	2025-04-11 01:18:56.383	2025-04-11 01:18:56.383
be481abb-304b-4ddf-ac02-7fd50c3f28bf	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	4e681273-544f-46ef-8105-9c33c3fac95e	3	\N	Juliana Ribeiro	\N	Ciclistas Unidos	00:44.890	2025-04-11 01:18:56.386	2025-04-11 01:18:56.386
4ba3912c-d95f-4269-a66e-7db2b3d209f3	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	4e681273-544f-46ef-8105-9c33c3fac95e	4	\N	Camila Martins	\N	Bike Club	00:45.234	2025-04-11 01:18:56.39	2025-04-11 01:18:56.39
9129e357-436a-4d05-8fb7-c47eefeb97db	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	4e681273-544f-46ef-8105-9c33c3fac95e	5	\N	Larissa Gomes	\N	Pedalada Radical	00:46.789	2025-04-11 01:18:56.394	2025-04-11 01:18:56.394
d8390480-d292-4370-8050-b57f198a3ef3	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	8ee4e740-3226-4608-8611-0932066baee1	1	\N	Carlos Eduardo	\N	Clube Ciclismo Goiânia	00:40.467	2025-04-11 01:18:56.398	2025-04-11 01:18:56.398
0f123ff0-7ef6-41d2-ac5f-08616983fbd5	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	8ee4e740-3226-4608-8611-0932066baee1	2	\N	Rodrigo Mendes	\N	Pedal Livre	00:41.234	2025-04-11 01:18:56.401	2025-04-11 01:18:56.401
ea33c2e0-fe22-49f4-8c6e-c57a5e057c1e	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	8ee4e740-3226-4608-8611-0932066baee1	3	\N	Bruno Cardoso	\N	Ciclistas Unidos	00:42.567	2025-04-11 01:18:56.404	2025-04-11 01:18:56.404
d038d10a-7b8c-45c4-86da-460dc6dd2442	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	8ee4e740-3226-4608-8611-0932066baee1	4	\N	Daniel Alves	\N	Bike Club	00:43.890	2025-04-11 01:18:56.408	2025-04-11 01:18:56.408
be5ab2f6-2f0b-4676-b953-150ee0f7e4b3	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	8ee4e740-3226-4608-8611-0932066baee1	5	\N	Thiago Moreira	\N	Pedalada Radical	00:44.123	2025-04-11 01:18:56.413	2025-04-11 01:18:56.413
\.


--
-- Data for Name: FiliationAnnualConfig; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."FiliationAnnualConfig" (id, year, "initialFilingFee", "renewalFee", "clubChangeStatusFee", "isActive", "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
95904196-db18-46dc-80c0-8e1da849f71c	2025	100.00	80.00	50.00	t	2025-04-02 15:45:21.044016+00	2025-04-02 15:45:21.044016+00	\N	\N
\.


--
-- Data for Name: FiliationBanner; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."FiliationBanner" (id, type, image, title, "buttonText", "buttonUrl", "buttonPosition", active, "createdAt", "updatedAt", "federationId") FROM stdin;
athlete-1747183523632	ATHLETE	https://dev.bemai.com.br/api/filiacao/banner/image?path=filiacao-banners%2F1747183516677-tddvrktye8i.png	Filiação de Atleta	\N	\N	bottom-right	t	2025-05-14 00:45:23.632	2025-05-14 00:45:23.632	\N
club-1747183809403	CLUB	https://dev.bemai.com.br/api/filiacao/banner/image?path=filiacao-banners%2F1747183804760-4izrk9t10fg.png	Filiação de Clube	\N	\N	bottom-right	t	2025-05-14 00:50:09.403	2025-05-14 00:50:09.403	\N
\.


--
-- Data for Name: FiliationCategory; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."FiliationCategory" (id, name, active, "order", "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
62a31363-0fc0-4310-a3b5-cce09e11898c	Elite	t	1	2025-04-04 14:43:01.916	2025-04-04 14:43:01.916	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
42966e2a-58bc-4d49-93a6-be6c7acb6b4f	Junuior	t	2	2025-04-04 14:43:36.808	2025-04-04 14:43:36.808	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
e3859fd0-e9a2-486b-a8f7-5bf3ef074142	Open	t	3	2025-04-04 14:44:05.581	2025-04-04 14:44:05.581	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
797bd929-e1e0-4efd-ab0e-f288f47028bb	Super Master A	t	4	2025-04-04 14:44:37.943	2025-04-04 14:44:37.943	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
2d8e98c8-38a4-49e1-b374-f5d2af4c9311	Super MTB	t	5	2025-04-04 14:45:06.975	2025-04-04 14:45:06.975	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
\.


--
-- Data for Name: FiliationConfig; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."FiliationConfig" (id, "postPaymentInstructions", "updatedAt", "updatedBy", "prePaymentInstructions", "termsAndConditions", "documentationRequirements", "paymentMethods", "paymentGateways", "notificationSettings", "filiationPeriod", "renewalInstructions", "isActive", "faqContent", "contactInfo", "requiredFields", "priceSettings", "discountRules", "documentValidityPeriod", "approvalWorkflow") FROM stdin;
default-filiation	Após o pagamento, envie os documentos necessários para completar sua filiação.	2025-03-17 23:58:58.863	5fa9fec3-1936-431d-bbac-faf36c62c043	Preencha todos os campos do formul├â┬írio e escolha as modalidades desejadas. Ap├â┬│s o envio, voc├â┬¬ ser├â┬í redirecionado para a p├â┬ígina de pagamento.	Ao se filiar ├â┬á Federa├â┬º├â┬úo Goiana de Ciclismo, o atleta concorda com os termos e condi├â┬º├â┬Áes estabelecidos no estatuto da entidade.	{"foto": "Foto 3x4 recente para carteirinha", "atestado": "Atestado m├â┬®dico com validade de at├â┬® 6 meses", "identidade": "Documento de identidade com foto"}	{PIX,CREDIT_CARD,BOLETO}	{MERCADOPAGO}	\N	{"endDate": "2025-12-31", "startDate": "2025-01-01"}	\N	t	\N	{"email": "filiacao@fgc.org.br", "telefone": "(62) 99999-9999", "whatsapp": "(62) 99999-9999"}	{}	\N	\N	\N	\N
\.


--
-- Data for Name: FiliationModality; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."FiliationModality" (id, name, price, active, "order", "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
bcddde3d-45d3-4a6c-a098-df953056e0d1	Cicloturismo	0.00	t	4	2025-03-30 21:36:39.88	2025-03-30 21:36:39.879	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
b12a1f42-8530-4a25-ab1f-f3a4661e4929	Ciclismo de Estrada	70.00	t	1	2025-04-04 14:40:56.222	2025-04-04 14:40:56.221	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
402e9e9d-3fd1-49c9-b6f4-12413801fb14	MTB	70.00	t	2	2025-04-04 14:41:14.487	2025-04-04 14:41:14.486	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
00ef4e35-0e03-4387-ac8b-2e70a0ecef49	BMX	30.00	t	3	2025-04-04 14:41:42.374	2025-04-04 14:41:42.373	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
\.


--
-- Data for Name: FooterConfig; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."FooterConfig" (id, logo, background, "hoverColor", "textColor", "isActive", "createdAt", "updatedAt", "createdBy", "updatedBy", cidade, cnpj, endereco, estado, email, telefone, whatsapp) FROM stdin;
default-footer	https://dev.bemai.com.br/storage/footer/1747234013495-rwmiz5o0o6i.png	#08285d	#177cc3	#ffffff	t	2025-02-23 20:16:45.437	2025-05-14 14:47:51.204	\N	\N	Goiânia	XX.XXX.XXX/0001-XX	Rua XX, no XXX	GO	contato@fgc.org.br	(62) 3000-0000	(62) 90000-0000
\.


--
-- Data for Name: FooterMenu; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."FooterMenu" (id, label, url, "order", "isActive", "requireAuth", roles, "footerId", "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
78a81b1d-7858-471d-8239-a6cbbd87ca2a	Eventos	http://localhost:3000	1	t	f	{}	default-footer	2025-02-24 23:42:37.729	2025-02-24 23:42:37.728	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
9c3c30f7-1623-4b1b-be7f-89585076057b	Noticias	http://localhost:3000	2	t	f	{}	default-footer	2025-02-25 00:16:24.453	2025-02-25 00:16:24.451	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
87bf26e5-96f0-4143-80e0-6b73bfa7a8f0	Filia-se	http://localhost:3000	0	t	f	{}	default-footer	2025-02-24 23:36:01.208	2025-03-29 18:36:33.968	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
\.


--
-- Data for Name: GalleryEvent; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."GalleryEvent" (id, title, description, modality, category, date, slug, "createdAt", "updatedAt") FROM stdin;
565b11c3-554b-4b9f-a56f-4e721109c31f	Galeria de Imagens Teste	So um teste de galeia de fotos	ciclismo	elite	2025-05-14 00:00:00	galeria-de-imagens-teste	2025-05-14 13:59:02.012	2025-05-14 13:59:02.011
\.


--
-- Data for Name: GalleryImage; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."GalleryImage" (id, filename, url, thumbnail, size, "eventId", "createdAt", "updatedAt") FROM stdin;
27d35ed7-5268-4315-8c83-79dd7f2fd4a6	27d35ed7-5268-4315-8c83-79dd7f2fd4a6.jpg	https://dev.bemai.com.br/storage/galeria-de-imagens/565b11c3-554b-4b9f-a56f-4e721109c31f/default/27d35ed7-5268-4315-8c83-79dd7f2fd4a6.jpg	https://dev.bemai.com.br/storage/galeria-de-imagens/565b11c3-554b-4b9f-a56f-4e721109c31f/default/27d35ed7-5268-4315-8c83-79dd7f2fd4a6-thumb.jpg	114185	565b11c3-554b-4b9f-a56f-4e721109c31f	2025-05-14 14:01:28.248	2025-05-14 14:01:28.246
3ca6b7a3-c250-40f2-b60e-15756fc283ac	3ca6b7a3-c250-40f2-b60e-15756fc283ac.jpg	https://dev.bemai.com.br/storage/galeria-de-imagens/565b11c3-554b-4b9f-a56f-4e721109c31f/default/3ca6b7a3-c250-40f2-b60e-15756fc283ac.jpg	https://dev.bemai.com.br/storage/galeria-de-imagens/565b11c3-554b-4b9f-a56f-4e721109c31f/default/3ca6b7a3-c250-40f2-b60e-15756fc283ac-thumb.jpg	149705	565b11c3-554b-4b9f-a56f-4e721109c31f	2025-05-14 14:01:28.25	2025-05-14 14:01:28.248
fee0f2e4-ceec-429e-8415-e0ca52d23752	fee0f2e4-ceec-429e-8415-e0ca52d23752.jpg	https://dev.bemai.com.br/storage/galeria-de-imagens/565b11c3-554b-4b9f-a56f-4e721109c31f/default/fee0f2e4-ceec-429e-8415-e0ca52d23752.jpg	https://dev.bemai.com.br/storage/galeria-de-imagens/565b11c3-554b-4b9f-a56f-4e721109c31f/default/fee0f2e4-ceec-429e-8415-e0ca52d23752-thumb.jpg	132030	565b11c3-554b-4b9f-a56f-4e721109c31f	2025-05-14 14:01:28.254	2025-05-14 14:01:28.253
48d7efdc-54b4-48a4-8dce-cfce44ec7c70	48d7efdc-54b4-48a4-8dce-cfce44ec7c70.jpg	https://dev.bemai.com.br/storage/galeria-de-imagens/565b11c3-554b-4b9f-a56f-4e721109c31f/default/48d7efdc-54b4-48a4-8dce-cfce44ec7c70.jpg	https://dev.bemai.com.br/storage/galeria-de-imagens/565b11c3-554b-4b9f-a56f-4e721109c31f/default/48d7efdc-54b4-48a4-8dce-cfce44ec7c70-thumb.jpg	38896	565b11c3-554b-4b9f-a56f-4e721109c31f	2025-05-14 14:01:28.252	2025-05-14 14:01:28.25
04a3b4e2-84b4-416c-983a-feff2c1425a4	04a3b4e2-84b4-416c-983a-feff2c1425a4.jpg	https://dev.bemai.com.br/storage/galeria-de-imagens/565b11c3-554b-4b9f-a56f-4e721109c31f/default/04a3b4e2-84b4-416c-983a-feff2c1425a4.jpg	https://dev.bemai.com.br/storage/galeria-de-imagens/565b11c3-554b-4b9f-a56f-4e721109c31f/default/04a3b4e2-84b4-416c-983a-feff2c1425a4-thumb.jpg	118278	565b11c3-554b-4b9f-a56f-4e721109c31f	2025-05-14 14:01:28.27	2025-05-14 14:01:28.269
f6f814b1-1808-4853-9751-7b38d166340d	f6f814b1-1808-4853-9751-7b38d166340d.jpg	https://dev.bemai.com.br/storage/galeria-de-imagens/565b11c3-554b-4b9f-a56f-4e721109c31f/default/f6f814b1-1808-4853-9751-7b38d166340d.jpg	https://dev.bemai.com.br/storage/galeria-de-imagens/565b11c3-554b-4b9f-a56f-4e721109c31f/default/f6f814b1-1808-4853-9751-7b38d166340d-thumb.jpg	134337	565b11c3-554b-4b9f-a56f-4e721109c31f	2025-05-14 14:01:28.284	2025-05-14 14:01:28.283
af743650-3b53-438f-9687-aaf2d1cf414c	af743650-3b53-438f-9687-aaf2d1cf414c.jpg	https://dev.bemai.com.br/storage/galeria-de-imagens/565b11c3-554b-4b9f-a56f-4e721109c31f/default/af743650-3b53-438f-9687-aaf2d1cf414c.jpg	https://dev.bemai.com.br/storage/galeria-de-imagens/565b11c3-554b-4b9f-a56f-4e721109c31f/default/af743650-3b53-438f-9687-aaf2d1cf414c-thumb.jpg	207037	565b11c3-554b-4b9f-a56f-4e721109c31f	2025-05-14 14:01:28.288	2025-05-14 14:01:28.287
\.


--
-- Data for Name: Gender; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Gender" (id, name, code, active, "createdAt", "updatedAt") FROM stdin;
b4f82f14-79d6-4123-a29b-4d45ff890a52	Masculino	MALE	t	2025-03-04 13:11:17.589	2025-03-04 13:11:17.589
7718a8b0-03f1-42af-a484-6176f8bf055e	Feminino	FEMALE	t	2025-03-04 13:11:17.589	2025-03-04 13:11:17.589
1b387385-aab8-4da2-b745-3f6ebdc83027	Todos	ALL	t	2025-03-04 13:11:17.589	2025-03-04 13:11:17.589
\.


--
-- Data for Name: HeaderConfig; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."HeaderConfig" (id, logo, background, "hoverColor", "textColor", "createdAt", "updatedAt", "createdBy", "isActive", "updatedBy") FROM stdin;
default-header	https://dev.bemai.com.br/storage/header/1747237721256-igkjo6o2lp.png	#08285d	#177cc3	#ffffff	2025-02-23 20:08:28.997	2025-05-14 15:48:44.753	\N	t	\N
\.


--
-- Data for Name: HeaderMenu; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."HeaderMenu" (id, label, url, "order", "isActive", "headerId", "createdAt", "updatedAt", "createdBy", "requireAuth", roles, "updatedBy") FROM stdin;
7a8e549e-3eff-4efe-aa10-ec86673d0900	Galerias	/galeria	5	t	default-header	2025-03-31 17:27:16.706	2025-03-31 17:27:16.705	5fa9fec3-1936-431d-bbac-faf36c62c043	f	{}	5fa9fec3-1936-431d-bbac-faf36c62c043
196985b5-39b4-47f7-b861-9145d918c68d	Filia-se	/#filiacao	0	t	default-header	2025-03-28 20:29:41.367	2025-03-28 20:29:41.365	5fa9fec3-1936-431d-bbac-faf36c62c043	f	{}	5fa9fec3-1936-431d-bbac-faf36c62c043
menu_1740444813394_pi8tobm	Eventos	/eventos	1	t	default-header	2025-02-25 00:53:33.395	2025-02-25 00:53:33.395	5fa9fec3-1936-431d-bbac-faf36c62c043	f	{}	5fa9fec3-1936-431d-bbac-faf36c62c043
menu_1740444832486_16opdkb	Noticias	/noticias	2	t	default-header	2025-02-25 00:53:52.486	2025-02-25 00:53:52.486	5fa9fec3-1936-431d-bbac-faf36c62c043	f	{}	5fa9fec3-1936-431d-bbac-faf36c62c043
ca78e29a-17bf-4f32-9f4d-1e9db44ba440	Rankings	/#rankings	3	t	default-header	2025-03-31 17:23:55.19	2025-03-31 17:23:55.189	5fa9fec3-1936-431d-bbac-faf36c62c043	f	{}	5fa9fec3-1936-431d-bbac-faf36c62c043
c597e849-4dd9-4fc8-a5f7-bfedc186181d	Campeões	/#campeoes	4	t	default-header	2025-03-31 17:25:21.156	2025-03-31 17:25:21.155	5fa9fec3-1936-431d-bbac-faf36c62c043	f	{}	5fa9fec3-1936-431d-bbac-faf36c62c043
db3f29af-7f81-49c0-8fe2-5ee518f27321	Parceiros	http://localhost:3000	6	t	default-header	2025-03-08 12:28:10.142	2025-03-08 12:28:10.102	5fa9fec3-1936-431d-bbac-faf36c62c043	f	{}	5fa9fec3-1936-431d-bbac-faf36c62c043
\.


--
-- Data for Name: Indicator; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Indicator" (id, title, value, icon, "order", active, "createdAt", "updatedAt", "createdBy", "updatedBy", subtitle, "iconColor", "backgroundColor", "textColor") FROM stdin;
8f9717e7-d397-4260-9627-3cf8bb5d0397	Eventos Anuais	30+	calendar	1	t	2025-03-27 18:34:08.605	2025-04-22 15:03:10.618	\N	5fa9fec3-1936-431d-bbac-faf36c62c043	Competições oficias	#ffffff	#1a5fb4	#ffffff
38ca1e57-09d6-4c3e-803b-33792c9e8f27	Atletas Filiados	400+	users	1	t	2025-03-27 18:10:19.359	2025-04-22 15:03:54.306	\N	5fa9fec3-1936-431d-bbac-faf36c62c043	Ciclistas federados ativos	#ffffff	#1a5fb4	#ffffff
f8d2739c-a141-408b-9ae3-c25373033e95	Cidades Alcançadas	25+	map-pin	3	t	2025-03-27 19:03:45.508	2025-04-22 15:04:25.638	\N	5fa9fec3-1936-431d-bbac-faf36c62c043	Em todo estado de Goiás 	#ffffff	#1a5fb4	#ffffff
4f26e95c-c803-48f9-af79-81bbff5d9f61	Titulos nacionais 	13+	trophy	4	t	2025-03-27 19:05:38.391	2025-04-22 15:04:43.432	\N	5fa9fec3-1936-431d-bbac-faf36c62c043	Conquistados pelos nossos atletas	#ffffff	#1a5fb4	#ffffff
\.


--
-- Data for Name: LegalDocuments; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."LegalDocuments" (id, type, title, content, "isActive", "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
legal-doc-lgpd	lgpd	Lei Geral de Prote├º├úo de Dados (LGPD)	A Federa├º├úo Goiana de Ciclismo est├í em conformidade com a Lei Geral de Prote├º├úo de Dados (Lei n┬║ 13.709/2018).\n\nBases Legais\n\nProcessamos dados pessoais com base em:\n- Consentimento do titular\n- Cumprimento de obriga├º├úo legal\n- Execu├º├úo de contrato\n- Leg├¡timo interesse\n\nDireitos do Titular\n\nConforme a LGPD, voc├¬ tem direito a:\n1. Confirma├º├úo da exist├¬ncia de tratamento\n2. Acesso aos dados\n3. Corre├º├úo de dados incompletos\n4. Anonimiza├º├úo ou bloqueio\n5. Portabilidade\n6. Elimina├º├úo\n7. Informa├º├úo sobre compartilhamento\n8. Revoga├º├úo do consentimento\n\nMedidas de Seguran├ºa\n\nImplementamos:\n- Criptografia de dados\n- Controles de acesso\n- Pol├¡ticas de seguran├ºa\n- Treinamento de equipe\n\nEncarregado de Dados (DPO)\n\nNosso DPO pode ser contatado em: dpo@fgc.org.br\n\nRelat├│rio de Impacto\n\nMantemos Relat├│rio de Impacto ├á Prote├º├úo de Dados Pessoais, dispon├¡vel mediante solicita├º├úo justificada.	t	2025-02-23 16:47:06.754	2025-02-23 16:47:06.754	\N	\N
legal-doc-privacy	privacy-policy	Pol├¡tica de Privacidade	A Federa├º├úo Goiana de Ciclismo (FGC) est├í comprometida com a prote├º├úo da sua privacidade.\n\nColeta de Dados\n\nColetamos os seguintes tipos de informa├º├Áes:\n- Informa├º├Áes de cadastro (nome, e-mail, telefone)\n- Dados de atleta (quando aplic├ível)\n- Informa├º├Áes de pagamento\n- Dados de uso do site\n\nUso das Informa├º├Áes\n\nUtilizamos seus dados para:\n- Gerenciar sua filia├º├úo\n- Processar inscri├º├Áes em eventos\n- Enviar comunica├º├Áes importantes\n- Melhorar nossos servi├ºos\n\nProte├º├úo de Dados\n\nImplementamos medidas de seguran├ºa para proteger suas informa├º├Áes, incluindo:\n- Criptografia de dados sens├¡veis\n- Controle de acesso\n- Backups regulares\n- Monitoramento de seguran├ºa\n\nSeus Direitos\n\nVoc├¬ tem direito a:\n- Acessar seus dados\n- Corrigir informa├º├Áes incorretas\n- Solicitar exclus├úo de dados\n- Revogar consentimentos\n\nContato\n\nPara quest├Áes sobre privacidade: privacidade@fgc.org.br	t	2025-02-23 16:47:06.754	2025-02-23 16:47:06.754	\N	\N
legal-doc-terms	terms-of-use	Termos de Uso	Bem-vindo aos Termos de Uso da Federa├º├úo Goiana de Ciclismo (FGC).\n\nAceita├º├úo dos Termos\n\nAo acessar e usar este site, voc├¬ concorda com estes termos de uso.\n\nUso do Site\n\nO site deve ser usado para:\n- Filia├º├úo de atletas e clubes\n- Inscri├º├úo em eventos\n- Acesso a informa├º├Áes sobre competi├º├Áes\n- Consulta de rankings e resultados\n\nContas de Usu├írio\n\n- Voc├¬ ├® respons├ível por manter a seguran├ºa de sua conta\n- Informa├º├Áes fornecidas devem ser precisas\n- A FGC pode suspender contas que violem os termos\n\nPagamentos\n\n- Taxas de filia├º├úo e inscri├º├Áes s├úo n├úo-reembols├íveis\n- Pagamentos s├úo processados por gateways seguros\n- Valores s├úo em reais (BRL)\n\nPropriedade Intelectual\n\n- O conte├║do do site ├® propriedade da FGC\n- Uso n├úo autorizado ├® proibido\n- Logomarcas e marcas registradas s├úo protegidas\n\nContato\n\nPara d├║vidas sobre os termos: termos@fgc.org.br	t	2025-02-23 16:47:06.754	2025-02-23 16:47:06.754	\N	\N
\.


--
-- Data for Name: ModalityCategoryGender; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."ModalityCategoryGender" (id, "modalityId", "categoryId", "genderId", active, "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
d0faecb1-94a0-46ec-94de-b88c3a1f12ff	cm7ro2ao80001kja8o4jdj323	cm7roxtzq0011kja8s7xxmq2n	7718a8b0-03f1-42af-a484-6176f8bf055e	t	2025-04-06 02:03:59.741	2025-04-06 02:03:59.741	admin@fgc.com.br	admin@fgc.com.br
2c8809e6-ea17-4c43-b81b-d75331b9f49e	cm7ro2ao80001kja8o4jdj323	cm7roxtzq0011kja8s7xxmq2n	b4f82f14-79d6-4123-a29b-4d45ff890a52	t	2025-04-06 02:04:00.391	2025-04-06 02:04:00.391	admin@fgc.com.br	admin@fgc.com.br
d454040b-06bd-4991-a03c-8d350cf08333	cm7ro2ao80001kja8o4jdj323	3524e809-1524-4219-81dd-5a6459aa1894	7718a8b0-03f1-42af-a484-6176f8bf055e	t	2025-04-06 02:04:01.042	2025-04-06 02:04:01.042	admin@fgc.com.br	admin@fgc.com.br
85e85b1c-cf67-4b8a-9ec6-d0654e6311ea	cm7ro2ao80001kja8o4jdj323	3524e809-1524-4219-81dd-5a6459aa1894	b4f82f14-79d6-4123-a29b-4d45ff890a52	t	2025-04-06 02:04:01.684	2025-04-06 02:04:01.684	admin@fgc.com.br	admin@fgc.com.br
58af7620-6d23-4f7e-80fc-79a21c8861b4	cm7ro2ao80001kja8o4jdj323	4e681273-544f-46ef-8105-9c33c3fac95e	7718a8b0-03f1-42af-a484-6176f8bf055e	t	2025-04-06 02:04:02.328	2025-04-06 02:04:02.328	admin@fgc.com.br	admin@fgc.com.br
78f7ee25-5cec-4b8a-b6e2-dfac23d9cc2e	cm7ro2ao80001kja8o4jdj323	4e681273-544f-46ef-8105-9c33c3fac95e	b4f82f14-79d6-4123-a29b-4d45ff890a52	t	2025-04-06 02:04:02.971	2025-04-06 02:04:02.971	admin@fgc.com.br	admin@fgc.com.br
8d6f1219-31fb-437c-a6f0-822fd7a104bd	cm7ro2ao80001kja8o4jdj323	8ee4e740-3226-4608-8611-0932066baee1	7718a8b0-03f1-42af-a484-6176f8bf055e	t	2025-04-06 02:04:03.611	2025-04-06 02:04:03.611	admin@fgc.com.br	admin@fgc.com.br
22cd7ce9-d81f-4777-bcd1-760b07a5ba3c	cm7ro2ao80001kja8o4jdj323	8ee4e740-3226-4608-8611-0932066baee1	b4f82f14-79d6-4123-a29b-4d45ff890a52	t	2025-04-06 02:04:04.261	2025-04-06 02:04:04.261	admin@fgc.com.br	admin@fgc.com.br
4129a664-743d-4de5-aad2-97c24b798bf9	cm7rod87g0003kja83a2xjgwv	cm7roxtzq0011kja8s7xxmq2n	7718a8b0-03f1-42af-a484-6176f8bf055e	t	2025-04-06 02:04:23.701	2025-04-06 02:04:23.701	admin@fgc.com.br	admin@fgc.com.br
219ebd18-05ed-4218-844b-fa2450bb6ca5	cm7rod87g0003kja83a2xjgwv	cm7roxtzq0011kja8s7xxmq2n	b4f82f14-79d6-4123-a29b-4d45ff890a52	t	2025-04-06 02:04:24.338	2025-04-06 02:04:24.338	admin@fgc.com.br	admin@fgc.com.br
868f6e4e-9ac4-4f91-b13c-fb765f6ddcd5	cm7rod87g0003kja83a2xjgwv	fa06f64e-bf02-4fb9-8afa-5da62f49fb03	7718a8b0-03f1-42af-a484-6176f8bf055e	t	2025-04-06 02:04:24.989	2025-04-06 02:04:24.989	admin@fgc.com.br	admin@fgc.com.br
f4e1c25d-4367-464c-a53e-12893344077e	cm7rod87g0003kja83a2xjgwv	fa06f64e-bf02-4fb9-8afa-5da62f49fb03	b4f82f14-79d6-4123-a29b-4d45ff890a52	t	2025-04-06 02:04:25.632	2025-04-06 02:04:25.632	admin@fgc.com.br	admin@fgc.com.br
4508547a-f0ad-4108-b18a-897776ff4c30	cm7rod87g0003kja83a2xjgwv	3524e809-1524-4219-81dd-5a6459aa1894	7718a8b0-03f1-42af-a484-6176f8bf055e	t	2025-04-06 02:04:26.277	2025-04-06 02:04:26.277	admin@fgc.com.br	admin@fgc.com.br
da3f128e-7939-462b-b74b-e45ea5e2f414	cm7rod87g0003kja83a2xjgwv	3524e809-1524-4219-81dd-5a6459aa1894	b4f82f14-79d6-4123-a29b-4d45ff890a52	t	2025-04-06 02:04:26.933	2025-04-06 02:04:26.933	admin@fgc.com.br	admin@fgc.com.br
2592a416-ab10-4636-84df-77162737d675	cm7roc93s0002kja8p293o507	cm7roxtzq0011kja8s7xxmq2n	7718a8b0-03f1-42af-a484-6176f8bf055e	t	2025-04-06 02:05:08.473	2025-04-06 02:05:08.473	admin@fgc.com.br	admin@fgc.com.br
4064cf44-4967-4870-ac59-46d5ce62ab07	cm7roc93s0002kja8p293o507	cm7roxtzq0011kja8s7xxmq2n	b4f82f14-79d6-4123-a29b-4d45ff890a52	t	2025-04-06 02:05:09.122	2025-04-06 02:05:09.122	admin@fgc.com.br	admin@fgc.com.br
97b57112-273b-41d2-942a-8d113689720b	cm7roc93s0002kja8p293o507	3524e809-1524-4219-81dd-5a6459aa1894	7718a8b0-03f1-42af-a484-6176f8bf055e	t	2025-04-06 02:05:09.768	2025-04-06 02:05:09.768	admin@fgc.com.br	admin@fgc.com.br
6b303822-cd12-46bc-90ee-090de4a33d05	cm7roc93s0002kja8p293o507	3524e809-1524-4219-81dd-5a6459aa1894	b4f82f14-79d6-4123-a29b-4d45ff890a52	t	2025-04-06 02:05:10.411	2025-04-06 02:05:10.411	admin@fgc.com.br	admin@fgc.com.br
e86b0f0b-1c96-4f8e-81f8-f5e2f4e0f5b6	cm7roc93s0002kja8p293o507	4e681273-544f-46ef-8105-9c33c3fac95e	7718a8b0-03f1-42af-a484-6176f8bf055e	t	2025-04-06 02:05:11.058	2025-04-06 02:05:11.058	admin@fgc.com.br	admin@fgc.com.br
9bbf6128-f9b5-4c35-8c09-c9ea01ece8c6	cm7roc93s0002kja8p293o507	4e681273-544f-46ef-8105-9c33c3fac95e	b4f82f14-79d6-4123-a29b-4d45ff890a52	t	2025-04-06 02:05:11.697	2025-04-06 02:05:11.697	admin@fgc.com.br	admin@fgc.com.br
2e592e1f-6f18-4aee-9e4d-13aa4d227b29	cm7roc93s0002kja8p293o507	8ee4e740-3226-4608-8611-0932066baee1	7718a8b0-03f1-42af-a484-6176f8bf055e	t	2025-04-06 02:05:12.335	2025-04-06 02:05:12.335	admin@fgc.com.br	admin@fgc.com.br
970ac8ef-3ffe-4f5c-83c8-432dda5d316e	cm7roc93s0002kja8p293o507	8ee4e740-3226-4608-8611-0932066baee1	b4f82f14-79d6-4123-a29b-4d45ff890a52	t	2025-04-06 02:05:12.976	2025-04-06 02:05:12.976	admin@fgc.com.br	admin@fgc.com.br
fe51c7a0-fd8e-4801-b084-1994fd8499b7	cm7ro2ao80001kja8o4jdj323	e9fb334c-f044-4cd0-818f-0a82f698c0ad	7718a8b0-03f1-42af-a484-6176f8bf055e	t	2025-05-14 16:07:08.202	2025-05-14 16:07:08.202	admin@fgc.com.br	admin@fgc.com.br
8041d06c-9a20-4b0a-8392-769372b4fbd5	cm7ro2ao80001kja8o4jdj323	e9fb334c-f044-4cd0-818f-0a82f698c0ad	b4f82f14-79d6-4123-a29b-4d45ff890a52	t	2025-05-14 16:07:08.537	2025-05-14 16:07:08.537	admin@fgc.com.br	admin@fgc.com.br
362a09bb-f94b-4c37-b187-a66d2da2f507	cm7roc93s0002kja8p293o507	e9fb334c-f044-4cd0-818f-0a82f698c0ad	7718a8b0-03f1-42af-a484-6176f8bf055e	t	2025-05-14 16:07:16.299	2025-05-14 16:07:16.299	admin@fgc.com.br	admin@fgc.com.br
2d8a945f-046d-4999-8223-b4424eff3a1a	cm7roc93s0002kja8p293o507	e9fb334c-f044-4cd0-818f-0a82f698c0ad	b4f82f14-79d6-4123-a29b-4d45ff890a52	t	2025-05-14 16:07:16.609	2025-05-14 16:07:16.609	admin@fgc.com.br	admin@fgc.com.br
\.


--
-- Data for Name: ModalityToCategory; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."ModalityToCategory" ("modalityId", "categoryId") FROM stdin;
b12a1f42-8530-4a25-ab1f-f3a4661e4929	62a31363-0fc0-4310-a3b5-cce09e11898c
402e9e9d-3fd1-49c9-b6f4-12413801fb14	62a31363-0fc0-4310-a3b5-cce09e11898c
b12a1f42-8530-4a25-ab1f-f3a4661e4929	42966e2a-58bc-4d49-93a6-be6c7acb6b4f
402e9e9d-3fd1-49c9-b6f4-12413801fb14	42966e2a-58bc-4d49-93a6-be6c7acb6b4f
00ef4e35-0e03-4387-ac8b-2e70a0ecef49	42966e2a-58bc-4d49-93a6-be6c7acb6b4f
00ef4e35-0e03-4387-ac8b-2e70a0ecef49	e3859fd0-e9a2-486b-a8f7-5bf3ef074142
b12a1f42-8530-4a25-ab1f-f3a4661e4929	797bd929-e1e0-4efd-ab0e-f288f47028bb
402e9e9d-3fd1-49c9-b6f4-12413801fb14	2d8e98c8-38a4-49e1-b374-f5d2af4c9311
\.


--
-- Data for Name: News; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."News" (id, title, slug, content, excerpt, "coverImage", published, "authorId", "createdAt", "updatedAt", "publishedAt") FROM stdin;
4f2712a9-9072-46c0-bf5f-320e916c5953	Brasil conquista quatro medalhas na estreia da Copa do Mundo de Paraciclismo 2025	brasil-conquista-quatro-medalhas-na-estreia-da-copa-do-mundo-de-paraciclismo-2025	<p>A Seleção Brasileira de Paraciclismo começou com o pedal direito a temporada 2025 da Copa do Mundo. Na etapa de abertura, que está sendo disputada em Ostend, na Bélgica, os atletas brasileiros garantiram quatro medalhas na prova de contrarrelógio, disputada nos dois primeiros dias de competição. Foram três bronzes e uma prata, subindo ao pódio em quatro categorias.<br><br>Destaque na categoria WH3 (14,6 km), Jady Malavazzi conquistou a medalha de bronze com o tempo de 26min46s. Sua companheira de seleção, Mariana Garcia, também teve um bom desempenho, terminando em quinto lugar com 28min54s. A australiana Lauren Parker venceu a prova com 24min34s, seguida da francesa Anais Vicent, prata com 25min39s.<br><br>Na WH2, Gilmara do Rosário subiu ao pódio com a prata, somando 45min55s. A medalha de ouro ficou com Roberta Amadeo, da Itália, que fechou a prova em 34min29s. Já na WC1, a jovem Victoria Barbosa garantiu o bronze para o Brasil com 46min03s. As australianas dominaram a categoria com Tahlia Goodie cravando 38min06s e ficando com a medalha de ouro, e Kaitlyn Schurmann terminando com a prata com 42min47s.<br><br>Entre os homens, o experiente Lauro Chaman levou o bronze na MC5, com o tempo de 37min39s. O norte-americano Elouan Gardon conquistou o ouro com 37min03s, enquanto o holandês Daniel Gebru ficou com a prata ao marcar 37min33s.<br><br>Além dos medalhistas, outros brasileiros também marcaram presença em diversas categorias. Os resultados completos da etapa podem ser acompanhados no site: [ <a target="_blank" rel="noopener noreferrer nofollow" href="https://www.rsstiming.com/Resultats/UCIPara/RoadWCp/2025Ostend/Ostend2025.htm"><strong>CLASSIFICAÇÃO</strong></a> ] .<br><br>A competição segue no fim de semana, com a realização das provas de resistência neste sábado (3) e domingo (4), onde a Seleção Brasileira volta às disputas em busca de novos pódios.&nbsp;<br></p><p> </p><p><strong>Assessoria de Comunicação - CBC</strong></p><p>Telefone: (61) 3585.1051 | (61) 9123.2218&nbsp;<br>E-mail:&nbsp;<a target="_blank" rel="noopener noreferrer nofollow" href="mailto:imprensa@cbc.esp.br">imprensa@cbc.esp.br</a>&nbsp;<br>Curta a página da&nbsp;<a target="_blank" rel="noopener noreferrer nofollow" href="http://facebook.com/ciclismocbc"><strong>CBC no&nbsp;Facebook</strong></a><br>Assista aos nossos vídeos no&nbsp;Youtube&nbsp;<a target="_blank" rel="noopener noreferrer nofollow" href="https://www.youtube.com/ciclismocbc"><strong>Canal Oficial da CBC</strong></a></p>	Seleção brilha no contrarrelógio da etapa da Bélgica e segue na disputa com foco na prova de resistência\n	https://dev.bemai.com.br/storage/noticias/1747229767907-gtscejk8.png	t	5fa9fec3-1936-431d-bbac-faf36c62c043	2025-05-14 13:36:09.42	2025-05-14 13:36:09.419	2025-05-14 13:36:09.419
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Notification" (id, type, recipient, priority, status, "createdAt", "updatedAt") FROM stdin;
705b5c93-65ec-497f-9ddd-c94f738eed94	TEST	553199999999	normal	pending	2025-04-18 23:30:11.439	2025-04-18 23:30:11.438
ded2d064-42b1-4983-b0b8-899a37e3e34e	TEST	5562994242329	normal	pending	2025-04-18 23:33:41.681	2025-04-18 23:33:41.681
039145d0-93d5-479b-ac65-b9d81e90df70	MANUAL	62981216988	normal	pending	2025-04-18 23:46:54.478	2025-04-18 23:46:54.477
47f7e146-e565-47af-a9a5-cc49e69a7aac	MANUAL	62981216988	normal	delivered	2025-04-18 23:51:16.835	2025-04-18 23:51:16.834
59ac3287-f9b9-4456-a8e6-0adbed778f00	MANUAL	62981216988	normal	delivered	2025-04-19 00:41:49.666	2025-04-19 00:41:49.664
0d4cb3ea-fece-4d2e-9562-530d77d60134	MANUAL	62981216988	normal	delivered	2025-04-22 23:32:12.803	2025-04-22 23:32:12.802
5ac8a92d-627f-42c1-be60-7ebcf8456a57	MANUAL	62981216988	normal	delivered	2025-04-22 23:43:13.453	2025-04-22 23:43:13.452
ceec5e71-812b-4bf2-9195-a6546f625b0f	MANUAL	5562981216988	normal	delivered	2025-04-23 00:09:29.872	2025-04-23 00:09:29.87
fbe07769-2910-4e41-9b4b-2ab3d544b181	MANUAL	(62) 99424-2329	normal	delivered	2025-05-20 12:37:01.991	2025-05-20 12:37:01.989
9f597df5-a11e-4b1c-888e-5f0477666f28	MANUAL	(62) 99424-2329	normal	delivered	2025-05-20 12:57:30.053	2025-05-20 12:57:30.051
aca0aa10-a74e-47f1-9a30-b8fd8368be2d	MANUAL	(62) 99424-2329	normal	delivered	2025-05-20 13:52:35.185	2025-05-20 13:52:35.184
2ecdd089-0000-4ade-8231-716c115cfb61	test	62994242329	high	pending	2025-05-20 14:01:24.24	2025-05-20 14:01:24.241
msg_1747750218670_y6ge1su7j	WHATSAPP_MESSAGE	admin	normal	delivered	2025-05-20 14:10:18.673	2025-05-20 14:10:18.67
msg_1747750218794_p4dmm3qq4	WHATSAPP_MESSAGE	admin	normal	delivered	2025-05-20 14:10:18.795	2025-05-20 14:10:18.794
3d59ffe6-8913-4bb5-ba3a-ba39897465c0	MANUAL	(62) 99424-2329	normal	delivered	2025-05-20 14:17:41.195	2025-05-20 14:17:41.194
affc20ca-0501-4217-9e19-4f1d7676abe4	MANUAL	(62) 99424-2329	normal	delivered	2025-05-20 14:26:38.051	2025-05-20 14:26:39.058
d65384af-e0e5-4bb5-aae0-7b33810c7978	MANUAL	(62) 99424-2329	normal	delivered	2025-05-20 14:28:12.131	2025-05-20 14:28:12.97
7e675c8b-5eea-4622-a461-8cdcfe242fcd	MANUAL	(62) 99424-2329	normal	delivered	2025-05-20 15:59:37.215	2025-05-20 15:59:37.75
e2b8e9f5-a07e-4124-bb55-6a2d3b9915f8	MANUAL	(62) 99424-2329	normal	delivered	2025-05-21 12:26:21.285	2025-05-21 12:26:21.76
e4a7c30e-df8b-4171-971a-3c2c989530a5	test	5562994242329	high	delivered	2025-05-21 12:46:43.728	2025-05-21 12:46:44.209
fe40980d-c71e-4b82-950d-66c9373b1de0	REGISTRATION_CONFIRMED	5562994242329	high	delivered	2025-05-21 13:12:23.813	2025-05-21 13:12:24.437
msg_1747833367487_r8ta5pi3r	WHATSAPP_MESSAGE	admin	normal	delivered	2025-05-21 13:16:07.491	2025-05-21 13:16:07.487
msg_1747833367549_rf07kwl13	WHATSAPP_MESSAGE	admin	normal	delivered	2025-05-21 13:16:07.55	2025-05-21 13:16:07.549
13fbd233-6889-48a5-81fe-f1303d804ea5	USER_WELCOME	5562994242329	high	failed	2025-05-21 16:48:11.998	2025-05-21 16:48:12.058
c9ab8770-5c04-4437-ae28-5195dbfe59fb	USER_WELCOME	5562994242329	HIGH	DELIVERED	2025-05-21 17:03:16.366	2025-05-21 17:03:16.366
bc55b33a-4b7f-4697-ac0f-74a9b7d09c9f	AFFILIATION_CONFIRMED	5562994242329	HIGH	DELIVERED	2025-05-21 17:15:02.036	2025-05-21 17:15:02.036
00141f30-510b-4ac8-b49e-a358efcf2ae9	AFFILIATION_CONFIRMED	5562994242329	HIGH	DELIVERED	2025-05-21 17:18:54.291	2025-05-21 17:18:54.291
e56f2b32-14b9-4a60-a2e5-3dc6f73fffee	EVENT_RESULTS_PUBLISHED	5562994242329	HIGH	DELIVERED	2025-05-21 17:33:56.453	2025-05-21 17:33:56.451
\.


--
-- Data for Name: NotificationAttempt; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."NotificationAttempt" (id, "notificationId", channel, success, error, "providerId", "createdAt") FROM stdin;
ded2d064-42b1-4983-b0b8-899a37e3e34e_attempt_1745019221701	ded2d064-42b1-4983-b0b8-899a37e3e34e	whatsapp	f	\N	\N	2025-04-18 23:33:41.701
47f7e146-e565-47af-a9a5-cc49e69a7aac_attempt_1745020276863	47f7e146-e565-47af-a9a5-cc49e69a7aac	whatsapp	t	\N	msg_1745020278042_f6zoqa9laxj	2025-04-18 23:51:16.864
59ac3287-f9b9-4456-a8e6-0adbed778f00_attempt_1745023309695	59ac3287-f9b9-4456-a8e6-0adbed778f00	whatsapp	t	\N	msg_1745023309721_uo1u2pyf5z	2025-04-19 00:41:49.696
0d4cb3ea-fece-4d2e-9562-530d77d60134_attempt_1745364732831	0d4cb3ea-fece-4d2e-9562-530d77d60134	whatsapp	t	\N	msg_1745364732888_69vzqqg5gzt	2025-04-22 23:32:12.832
5ac8a92d-627f-42c1-be60-7ebcf8456a57_attempt_1745365393485	5ac8a92d-627f-42c1-be60-7ebcf8456a57	whatsapp	t	\N	msg_1745365393513_aj336jy6vsh	2025-04-22 23:43:13.486
ceec5e71-812b-4bf2-9195-a6546f625b0f_attempt_1745366969897	ceec5e71-812b-4bf2-9195-a6546f625b0f	whatsapp	t	\N	msg_1745366969948_wcsee9ec6db	2025-04-23 00:09:29.898
fbe07769-2910-4e41-9b4b-2ab3d544b181_attempt_1747744622025	fbe07769-2910-4e41-9b4b-2ab3d544b181	whatsapp	t	\N	msg_1747744622081_3bohkthvhpu	2025-05-20 12:37:02.026
9f597df5-a11e-4b1c-888e-5f0477666f28_attempt_1747745850077	9f597df5-a11e-4b1c-888e-5f0477666f28	whatsapp	t	\N	msg_1747745850099_3tocdyfombt	2025-05-20 12:57:30.078
aca0aa10-a74e-47f1-9a30-b8fd8368be2d_attempt_1747749155212	aca0aa10-a74e-47f1-9a30-b8fd8368be2d	whatsapp	t	\N	msg_1747749155261_b3eb8mxdwl	2025-05-20 13:52:35.213
9b2c4915-1bb7-4a89-b62a-7b69e1c206f2	2ecdd089-0000-4ade-8231-716c115cfb61	whatsapp	f	Request failed with status code 404	\N	2025-05-20 14:01:24.331
attempt_1747750218670_1o3fnx5ct	msg_1747750218670_y6ge1su7j	WHATSAPP	t	\N	E02C7B4D3E85AD8AD6A4251A1DF34AF1	2025-05-20 14:10:18.673
attempt_1747750218794_td3623cjn	msg_1747750218794_p4dmm3qq4	WHATSAPP	t	\N	E02C7B4D3E85AD8AD6A4251A1DF34AF1	2025-05-20 14:10:18.795
3d59ffe6-8913-4bb5-ba3a-ba39897465c0_attempt_1747750661230	3d59ffe6-8913-4bb5-ba3a-ba39897465c0	whatsapp	t	\N	msg_1747750661351_h2c6cpjof16	2025-05-20 14:17:41.231
affc20ca-0501-4217-9e19-4f1d7676abe4_direct_1747751198067	affc20ca-0501-4217-9e19-4f1d7676abe4	whatsapp	t	\N	3EB0CB66AF384D205E1405C45D62194A3856559E	2025-05-20 14:26:38.067
d65384af-e0e5-4bb5-aae0-7b33810c7978_direct_1747751292141	d65384af-e0e5-4bb5-aae0-7b33810c7978	whatsapp	t	\N	3EB0D1431DB382BA3882948E4820CDE684FCFC70	2025-05-20 14:28:12.141
7e675c8b-5eea-4622-a461-8cdcfe242fcd_direct_1747756777229	7e675c8b-5eea-4622-a461-8cdcfe242fcd	whatsapp	t	\N	3EB0D7681C4323181AB28686A93D823C37E95B70	2025-05-20 15:59:37.229
e2b8e9f5-a07e-4124-bb55-6a2d3b9915f8_direct_1747830381293	e2b8e9f5-a07e-4124-bb55-6a2d3b9915f8	whatsapp	t	\N	3EB074B18ADFF30B44DB4EB0B5D7D226EF2E483A	2025-05-21 12:26:21.293
ffba3c68-c1d0-442e-b112-cf4f481196b3	e4a7c30e-df8b-4171-971a-3c2c989530a5	whatsapp	t	\N	\N	2025-05-21 12:46:44.197
c080cf0a-875a-4b7b-8401-057a3f90956b	e4a7c30e-df8b-4171-971a-3c2c989530a5	whatsapp	t	\N	\N	2025-05-21 12:46:44.204
bc3931f2-288f-4913-84db-e166474b19f2	fe40980d-c71e-4b82-950d-66c9373b1de0	whatsapp	t	\N	\N	2025-05-21 13:12:24.427
d6760c4c-6c35-4db1-9b03-8924c92a2145	fe40980d-c71e-4b82-950d-66c9373b1de0	whatsapp	t	\N	\N	2025-05-21 13:12:24.433
attempt_1747833367487_7xgf1eqqr	msg_1747833367487_r8ta5pi3r	WHATSAPP	t	\N	EB5514379CF5E4F7AD8A2B106F9520FD	2025-05-21 13:16:07.491
attempt_1747833367549_opxqb9fji	msg_1747833367549_rf07kwl13	WHATSAPP	t	\N	EB5514379CF5E4F7AD8A2B106F9520FD	2025-05-21 13:16:07.55
c5e1471f-3cce-470d-9fde-8ba0b464183f	e56f2b32-14b9-4a60-a2e5-3dc6f73fffee	WHATSAPP	t	\N	\N	2025-05-21 17:33:56.451
\.


--
-- Data for Name: NotificationConfig; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."NotificationConfig" (id, "whatsappEnabled", "emailEnabled", "webhookEnabled", "whatsappToken", "whatsappPhoneId", "webhookUrl", "maxRetries", "createdAt", "updatedAt") FROM stdin;
default-config	t	t	t	/api/v1	5562994242329	meow_webhook_secret	3	2025-04-19 00:14:54.818	2025-04-19 00:31:36.346
\.


--
-- Data for Name: NotificationLog; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."NotificationLog" (id, type, recipient, channel, status, error, metadata, "sentAt", "createdAt", "updatedAt") FROM stdin;
f00fad33-bb0c-4092-8caf-f7622604376a	test	62994242329	whatsapp	failed	Request failed with status code 404	{"data": null, "error": "Request failed with status code 404", "success": false}	2025-05-20 14:01:24.323	2025-05-20 14:01:24.323	2025-05-20 14:01:24.323
60d9c35f-96aa-4320-8ea5-2befe67b3d71	EVENT_RESULTS_PUBLISHED	5562994242329	WHATSAPP	DELIVERED	\N	{"isTest": true, "userId": "457741f4-177b-471a-ae2c-c8320411e33b", "eventId": "a8f6cfb3-9fc8-4f04-89f9-63bd217c8e34", "eventTitle": "WHOOP UCI Mountain Bike World Series em 2025", "messageContent": "*Resultados Publicados! 🏁*\\n\\nEvento: WHOOP UCI Mountain Bike World Series em 2025\\nData: 09/04/2025\\n\\nOs resultados oficiais do evento já estão disponíveis para consulta.\\n\\nAcesse o link abaixo para visualizar:\\nhttps://dev.bemai.com.br/eventos/a8f6cfb3-9fc8-4f04-89f9-63bd217c8e34\\n\\nObrigado pela participação!\\n\\n*Federação Goiana de Ciclismo*"}	2025-05-21 17:33:56.474	2025-05-21 17:33:56.474	2025-05-21 17:33:56.474
\.


--
-- Data for Name: NotificationTemplate; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."NotificationTemplate" (id, type, channel, name, content, variables, active, "createdAt", "updatedAt") FROM stdin;
WELCOME_whatsapp_boas-vindas	WELCOME	whatsapp	Boas-vindas	Olá {{nome}}, bem-vindo(a) à Federação Goiana de Ciclismo! 🚴‍♂️ Estamos felizes em ter você conosco. Acesse nosso site para mais informações sobre eventos e filiação.	{nome}	t	2025-04-18 21:59:09.831	2025-04-18 21:59:09.776
EVENT_REMINDER_whatsapp_lembrete_de_evento	EVENT_REMINDER	whatsapp	Lembrete de Evento	Lembrete: O evento "{{evento}}" acontecerá em {{data}} às {{hora}} no local {{local}}. Não esqueça de levar seu equipamento e documentos. Esperamos você lá!	{evento,data,hora,local}	t	2025-04-18 21:59:10.429	2025-04-18 21:59:10.428
REGISTRATION_CONFIRMATION_whatsapp_confirmação_de_inscrição	REGISTRATION_CONFIRMATION	whatsapp	Confirmação de Inscrição	Sua inscrição para o evento "{{evento}}" foi confirmada! Número do atleta: {{numero}}. Data: {{data}}. Para mais detalhes, acesse nossa plataforma.	{evento,numero,data}	t	2025-04-18 21:59:10.433	2025-04-18 21:59:10.432
WELCOME_email_email_de_boas-vindas	WELCOME	email	Email de Boas-vindas	<h1>Bem-vindo à Federação Goiana de Ciclismo!</h1><p>Olá {{nome}},</p><p>É com grande prazer que damos as boas-vindas a você em nossa comunidade de ciclismo.</p><p>Seu cadastro foi realizado com sucesso e você já pode acessar todos os nossos serviços.</p><p>Atenciosamente,<br>Equipe FGC</p>	{nome}	t	2025-04-18 21:59:10.438	2025-04-18 21:59:10.437
COMPETITION_RESULTS_email_resultados_de_competição	COMPETITION_RESULTS	email	Resultados de Competição	<h1>Resultados - {{evento}}</h1><p>Olá {{nome}},</p><p>Os resultados da competição "{{evento}}" já estão disponíveis!</p><p>Sua classificação: {{posicao}}º lugar</p><p>Tempo: {{tempo}}</p><p>Parabéns pela participação!</p><p>Veja a classificação completa em nosso site.</p>	{nome,evento,posicao,tempo}	t	2025-04-18 21:59:10.443	2025-04-18 21:59:10.441
\.


--
-- Data for Name: Partner; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Partner" (id, name, logo, link, "order", active, "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
cm7jo7u0t0001uwhs3dvecbtv	fgc	parceiros/logos individuais-27.png	\N	1	t	2025-02-24 23:10:20.09	2025-02-24 23:10:20.09	5fa9fec3-1936-431d-bbac-faf36c62c043	\N
cm7kgk6bh0000uwscnziaqqjc	atletis	parceiros/logos individuais-37.png	\N	2	t	2025-02-25 12:23:45.124	2025-02-25 12:23:45.124	5fa9fec3-1936-431d-bbac-faf36c62c043	\N
cm7kgliyk0001uwscmbr97sk7	sonic	parceiros/logos individuais-28.png	\N	3	t	2025-02-25 12:24:48.169	2025-02-25 12:24:48.169	5fa9fec3-1936-431d-bbac-faf36c62c043	\N
cm7kgm5yj0002uwsc6jfd4isl	fonte	parceiros/logos individuais-15.png	\N	4	t	2025-02-25 12:25:17.991	2025-02-25 12:25:17.991	5fa9fec3-1936-431d-bbac-faf36c62c043	\N
cm7kgmwkb0003uwsczfbnm2x4	lucas kit├úo	parceiros/logos individuais-24.png	\N	5	t	2025-02-25 12:25:52.465	2025-02-25 12:25:52.465	5fa9fec3-1936-431d-bbac-faf36c62c043	\N
a538605b-2c73-4983-9768-52125a9aaf06	Secretaria de Esportes	parceiros/logos individuais-29.png	\N	6	t	2025-05-14 14:36:33.669	2025-05-14 14:36:33.669	\N	\N
\.


--
-- Data for Name: PasswordReset; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."PasswordReset" (id, email, token, "expiresAt", "createdAt", "userId", active, "updatedAt") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Payment" (id, provider, status, "paymentMethod", amount, currency, "athleteId", "clubId", "registrationId", "createdAt", "updatedAt", "externalId", "paymentData") FROM stdin;
0ad4c88e-1033-491b-b122-49c3991c1160	MERCADO_PAGO	PENDING	PIX	80.00	BRL	\N	4c832113-1796-418a-b402-723bf88d6b62	\N	2025-03-30 20:10:30.363	2025-03-30 20:10:30.362	c1481fcf-8398-4aec-87f5-4c2036e64791	{"type": "CLUB_RENEWAL", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Renovação de anuidade do clube: Clube Ciclismo Teste"}
21ab22f1-d325-4898-a8b3-a8493544f3e8	MERCADO_PAGO	PENDING	PIX	80.00	BRL	\N	4c832113-1796-418a-b402-723bf88d6b62	\N	2025-03-30 20:11:48.992	2025-03-30 20:11:48.99	ef71b3d9-cd09-4d32-8166-e40d9291bc93	{"type": "CLUB_RENEWAL", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Renovação de anuidade do clube: Clube Ciclismo Teste"}
9594752f-1d52-40cf-95c2-2d3bb9ad1060	MERCADO_PAGO	PENDING	PIX	80.00	BRL	\N	4c832113-1796-418a-b402-723bf88d6b62	\N	2025-03-30 20:23:17.211	2025-03-30 20:23:17.209	bfcdcaa8-7039-4b93-bcf9-79146dd24774	{"type": "CLUB_RENEWAL", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Renovação de anuidade do clube: Clube Ciclismo Teste"}
a40a797a-af03-47b4-8f69-c0aad61a88c8	MERCADO_PAGO	PENDING	PIX	70.00	BRL	6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	\N	\N	2025-03-30 20:55:06.238	2025-03-30 20:55:06.237	fea8e0f4-3c1c-46a1-9758-b03e2ddd6391	{"type": "ATHLETE_REGISTRATION", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Filiação de atleta: João Pedro"}
f9eb53fb-ab63-40fc-bb62-841cb8ddada5	MERCADO_PAGO	PENDING	PIX	80.00	BRL	\N	4c832113-1796-418a-b402-723bf88d6b62	\N	2025-03-30 20:56:29.707	2025-03-30 20:56:29.706	15124363-a99c-42a3-acbd-7d1b198a20f5	{"type": "CLUB_RENEWAL", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Renovação de anuidade do clube: Clube Ciclismo Teste"}
c269b545-b96b-417f-973f-ca6193c42f64	MERCADO_PAGO	PENDING	PIX	0.00	BRL	6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	\N	\N	2025-03-30 21:38:47.427	2025-03-30 21:38:47.426	53dcc775-fcac-44ff-8ae9-c10b3026ec43	{"type": "ATHLETE_REGISTRATION", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Filiação de atleta: Alberto Torres"}
27ea8eea-bf19-43c2-bf9f-4f656fd0b47e	SYSTEM	CONFIRMED	FREE	0.00	BRL	6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	\N	\N	2025-03-30 21:56:47.751	2025-03-30 21:56:47.749	732f9417-bded-4a1a-ada2-ab842c8391b5	{"type": "ATHLETE_REGISTRATION", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Filiação de atleta: Ivan Barbosa ", "isFreeModality": true}
2e795272-2a2c-4da8-a508-3195a547fe44	MERCADO_PAGO	PENDING	PIX	70.00	BRL	6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	\N	\N	2025-04-01 19:56:59.763	2025-04-01 19:56:59.762	7748fb75-b8ef-401c-be2d-20956efaf8a4	{"type": "ATHLETE_REGISTRATION", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Filiação de atleta: Weberty Gerolineto", "isFreeModality": false}
087a0089-487f-432a-9d8a-f54817072af3	MERCADO_PAGO	PENDING	PIX	70.00	BRL	6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	\N	\N	2025-04-01 20:06:15.917	2025-04-01 20:06:15.916	00e8b764-1c9c-479d-ab63-df47e87859d3	{"type": "ATHLETE_REGISTRATION", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Filiação de atleta: Weberty Gerolineto", "isFreeModality": false}
eb00ad94-d13d-40a0-b2dc-632d259d18f7	MERCADO_PAGO	PENDING	PIX	70.00	BRL	6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	\N	\N	2025-04-01 20:15:20.22	2025-04-01 20:15:20.218	777d55cc-a1f0-44c3-9c1d-1af6200dbb78	{"type": "ATHLETE_REGISTRATION", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Filiação de atleta: Weberty Gerolineto", "isFreeModality": false}
66862336-5007-4f84-916f-2b882464ad62	MERCADO_PAGO	PENDING	PIX	70.00	BRL	6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	\N	\N	2025-04-01 20:40:29.695	2025-04-01 20:40:29.693	7b9cac8c-5090-469d-b4d5-64fd3dd2972e	{"type": "ATHLETE_REGISTRATION", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Filiação de atleta: Weberty Gerolineto", "isFreeModality": false}
0c27ec8e-85f4-406a-83c0-8301df7ec691	MERCADO_PAGO	PENDING	PIX	70.00	BRL	6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	\N	\N	2025-04-01 20:43:34.135	2025-04-01 20:43:34.134	9a510947-da9a-4a82-87fb-6eb46c9bf238	{"type": "ATHLETE_REGISTRATION", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Filiação de atleta: Weberty Gerolineto", "isFreeModality": false}
e98fd406-c55b-422f-9ef7-8e2eb66eb7cb	MERCADO_PAGO	PENDING	PIX	70.00	BRL	6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	\N	\N	2025-04-01 21:02:33.113	2025-04-01 21:02:33.112	71fa4322-5608-4a0e-a6da-d61eeb8a4879	{"type": "ATHLETE_REGISTRATION", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Filiação de atleta: Weberty Gerolineto", "isFreeModality": false}
3614db12-0ef2-4b74-854a-66a65d545e29	MERCADO_PAGO	PENDING	PIX	70.00	BRL	6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	\N	\N	2025-04-01 21:50:52.235	2025-04-01 21:50:52.234	1602e6e1-29a8-424b-a229-db5da5cfc1b0	{"type": "ATHLETE_REGISTRATION", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Filiação de atleta: Weberty Gerolineto", "isFreeModality": false}
b645443b-5e3c-43c2-9390-29eaa600b5ad	SYSTEM	CONFIRMED	FREE	0.00	BRL	6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	\N	\N	2025-04-01 21:52:12.599	2025-04-01 21:52:12.598	65f643b8-ddcf-4b19-acce-298cec32888c	{"type": "ATHLETE_REGISTRATION", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Filiação de atleta: Weberty Gerolineto", "isFreeModality": true}
d717069b-fd31-467b-a701-33c0492b14ba	MERCADO_PAGO	PENDING	PIX	70.00	BRL	55e59c61-1f86-459c-8e06-55fcb115a432	\N	\N	2025-04-02 20:57:19.039	2025-04-02 20:57:19.038	44e0f7c5-b801-4d30-813c-82f125c1197b	{"type": "ATHLETE_REGISTRATION", "userId": "0ae569d4-e20f-4a44-bde3-ef29b05e112f", "description": "Filiação de atleta: Fulano de tal", "isFreeModality": false}
52ada2e8-8ee6-4a7e-819f-fce170e69801	SYSTEM	CONFIRMED	FREE	0.00	BRL	55e59c61-1f86-459c-8e06-55fcb115a432	\N	\N	2025-04-02 22:26:27.271	2025-04-02 22:26:27.269	8df4fc39-7071-4ea9-9dfe-d87fec00bbcb	{"type": "ATHLETE_REGISTRATION", "userId": "0ae569d4-e20f-4a44-bde3-ef29b05e112f", "description": "Filiação de atleta: Fulano de tal", "isFreeModality": true}
632554ef-f6c4-4c4b-852e-df5608fe2a14	MERCADO_PAGO	PENDING	PIX	100.00	BRL	6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	\N	\N	2025-04-05 18:37:02.305	2025-04-05 18:37:02.303	b63a19df-4eeb-42fe-86c1-0326c49a6b16	{"type": "STATUS_CHANGE", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "changeType": "TO_INDIVIDUAL", "description": "Mudança para atleta avulso: Weberty Gerolineto"}
76f2d880-e667-441f-bb31-7f7336438197	MERCADO_PAGO	PENDING	PIX	70.00	BRL	6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	\N	\N	2025-04-05 18:37:02.332	2025-04-05 18:37:02.331	b8a2201e-26d1-4da8-bc49-0a0f521d2267	{"type": "ATHLETE_REGISTRATION", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Filiação de atleta: Beto Teste", "isFreeModality": false}
8eb8e0aa-10b2-4a82-9d0d-335d0c21ebd9	MERCADO_PAGO	PENDING	PIX	70.00	BRL	6df37db3-88b6-496e-a2e0-5afbbf3bfbf8	\N	\N	2025-04-05 19:28:39.232	2025-04-05 19:28:39.231	8b179d68-818e-44c9-994b-71adf062e88f	{"type": "ATHLETE_REGISTRATION", "userId": "5fa9fec3-1936-431d-bbac-faf36c62c043", "description": "Filiação de atleta: Beto Teste", "isFreeModality": false}
6c810c08-ab7f-4f6a-9716-de776bba5329	MERCADO_PAGO	PENDING	PIX	70.00	BRL	temp_457741f4-177b-471a-ae2c-c8320411e33b	\N	\N	2025-04-10 13:51:04.529	2025-04-10 13:51:04.528	c52fa94b-b927-4716-9dbb-af8784e59564	{"type": "ATHLETE_REGISTRATION", "userId": "457741f4-177b-471a-ae2c-c8320411e33b", "description": "Filiação de atleta: Weberty Gerolineto", "isFreeModality": false}
33caf855-11f1-4c1c-9c10-8cc229f1e725	MERCADO_PAGO	PENDING	PIX	30.00	BRL	temp_457741f4-177b-471a-ae2c-c8320411e33b	\N	\N	2025-04-10 13:55:38.521	2025-04-10 13:55:38.519	09525a52-912e-4234-a8cb-cb57c61d5e87	{"type": "ATHLETE_REGISTRATION", "userId": "457741f4-177b-471a-ae2c-c8320411e33b", "description": "Filiação de atleta: Fulano de tal", "isFreeModality": false}
4669ac1c-37f9-4e0e-b811-866089997834	MERCADO_PAGO	PENDING	PIX	30.00	BRL	temp_457741f4-177b-471a-ae2c-c8320411e33b	\N	\N	2025-04-10 14:02:59.869	2025-04-10 14:02:59.868	0f7f43ff-9034-43bb-ac25-77a454403970	{"type": "ATHLETE_REGISTRATION", "userId": "457741f4-177b-471a-ae2c-c8320411e33b", "description": "Filiação de atleta: Weberty Gerolineto", "isFreeModality": false}
test123	PAGSEGURO	PAID		100.00	BRL	\N	\N	\N	2025-04-19 19:34:54.549	2025-04-19 19:58:18.459	test123	{"id": "test123", "amount": {"value": 10000}, "status": "PAID", "metadata": {"entityType": "EVENT"}}
2ed3b8bc-4b59-4ccf-a01d-4bcaabea2afb	MERCADO_PAGO	PENDING	PIX	100.00	BRL	temp_457741f4-177b-471a-ae2c-c8320411e33b	\N	\N	2025-05-16 00:11:32.536	2025-05-16 00:11:32.535	22f2d2f6-5687-4ce5-963a-f76f6d9f1443	{"type": "STATUS_CHANGE", "userId": "457741f4-177b-471a-ae2c-c8320411e33b", "changeType": "TO_INDIVIDUAL", "description": "Mudança para atleta avulso: Weberty Gerolineto"}
41d4d336-4eab-40d0-a000-4ef86e053f18	SYSTEM	CONFIRMED	FREE	0.00	BRL	temp_457741f4-177b-471a-ae2c-c8320411e33b	\N	\N	2025-05-16 00:11:32.562	2025-05-16 00:11:32.561	bfa68655-9cea-4228-8dda-572b95ca0b9f	{"type": "ATHLETE_REGISTRATION", "userId": "457741f4-177b-471a-ae2c-c8320411e33b", "description": "Filiação de atleta: Weberty Gerolineto", "isFreeModality": true}
\.


--
-- Data for Name: PaymentGatewayConfig; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."PaymentGatewayConfig" (id, name, provider, active, priority, "allowedMethods", "entityTypes", "checkoutType", sandbox, webhook, urls, credentials, "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
02457dc9-9a31-4682-bd65-63db91d84fa9	Mercado Pago	MERCADO_PAGO	f	2	{PIX,CREDIT_CARD,DEBIT_CARD,BOLETO}	{ATHLETE,CLUB,EVENT,FEDERATION}	REDIRECT	t	{"retryAttempts": 3, "retryInterval": 5000}	{"failure": "http://localhost:3000/filiacao/failure", "success": "http://localhost:3000/filiacao/success", "notification": "http://localhost:3000/api/webhooks/payment"}	{"public_key": "TEST-f32477fb-deac-4e9d-a58c-85c68e1a9cef", "access_token": "TEST-8024967414107466-031717-60f009a01f10a47147b20f80629b3972-126602599"}	2025-03-31 21:03:46.368	2025-04-17 15:15:42.277	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
30d933c2-5c75-40d5-907d-92a9c3a9d082	PagSeguro Direct	PAGSEGURO	t	3	{PIX,CREDIT_CARD,BOLETO,DEBIT_CARD}	{ATHLETE,CLUB,EVENT,FEDERATION}	TRANSPARENT	t	{"retryAttempts": 3, "retryInterval": 5000}	{"failure": "http://localhost:3000/pagamento/erro", "success": "http://localhost:3000/pagamento/sucesso", "notification": "http://localhost:3000/api/payments/gateway/webhook"}	{"pagseguroAppId": "app0155491563", "pagseguroEmail": "betofoto1@gmail.com", "pagseguroToken": "2C20AC5358084157AFD3DB315C69A68C", "pagseguroAppKey": "2A75ECF1E1E1FB6FF4A63FB222D1BBB2"}	2025-04-17 15:31:42.832	2025-04-17 17:12:31.037	5fa9fec3-1936-431d-bbac-faf36c62c043	5fa9fec3-1936-431d-bbac-faf36c62c043
\.


--
-- Data for Name: PaymentHistory; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."PaymentHistory" (id, "transactionId", status, description, "createdAt") FROM stdin;
9635ae51-54bd-4dbc-86d6-49da9303c4a5	0b00e6b7-a4d4-4301-b68d-b1fd6893d30d	PENDING	Pagamento iniciado via undefined	2025-03-31 21:52:48.753
b710cea5-fd4f-4887-9ead-429ba27bb15b	d9a05e48-4d4c-4ef4-ac07-9f0d4e7f2f27	PENDING	Pagamento iniciado via undefined	2025-03-31 21:58:59.533
c6cb153e-b486-4978-b1b3-66ed07bfc1b4	efc84b3e-28d0-495f-b2cf-4eaf7c5198c9	PENDING	Pagamento iniciado via undefined	2025-03-31 22:02:45.128
552228e9-f39f-4b88-8535-b9ebda7b8752	b9a40b54-e219-4de4-9b78-5df032296939	PENDING	Pagamento iniciado via undefined	2025-03-31 22:07:48.233
3baf019b-875f-46d0-a761-175139bdf0fa	af359517-2869-4765-9db1-a50f239d65c9	PENDING	Pagamento iniciado via undefined	2025-03-31 22:58:14.213
8daff162-d3e6-4778-b16b-6f673faea9df	e00dcbb2-a683-449c-8017-542aaea23827	PENDING	Pagamento iniciado via undefined	2025-03-31 23:08:11.885
4ddaa924-ac24-472c-aa91-9f6f2057c3e9	2cb6d788-cd3f-4c78-bb5e-80343cfba7cf	PENDING	Pagamento iniciado via undefined	2025-04-01 16:43:42.447
3d87a33e-ad87-4e16-9bf6-5a6ac7922844	fd464c37-412e-426f-807e-4c641f8b10cb	PENDING	Pagamento iniciado via Mercado Pago	2025-04-01 17:09:14.458
300432d9-2d1d-4517-9420-a40838f33ba6	369ded0a-6700-401c-a94c-4a7ad55674d3	PENDING	Pagamento iniciado via Mercado Pago	2025-04-01 17:30:18.701
3de168c8-b285-442d-a99a-9d01d03b94b7	882e7bed-6630-4a44-ab4c-eba1c60589fc	PENDING	Pagamento iniciado via Mercado Pago	2025-04-01 19:06:15.547
18f26b83-6ea1-4cc9-a036-5cb4c939267b	73f52294-0e47-4fd2-bce3-dffb5e188237	PENDING	Pagamento iniciado via Mercado Pago	2025-04-01 19:17:19.242
65f60476-a06c-40d6-b6d9-a54760eaf5ee	9f5e3b88-a16e-4572-b9a8-8ceaf5c0dea3	PENDING	Pagamento iniciado via Mercado Pago	2025-04-01 19:26:25.693
4534860d-b17c-4344-bb21-a6e36ad6b2a1	56333b6a-8a56-4642-8265-c55c87e2d9cc	PENDING	Pagamento iniciado via Mercado Pago	2025-04-01 20:39:06.416
591450b2-1dbb-491e-b161-27d71b6c7181	5c718e6d-d652-46b5-a7fc-bf4eb0528bb1	PENDING	Pagamento iniciado via Mercado Pago	2025-04-17 00:25:36.543
f0433106-f8a8-46ed-85eb-5fa4600e2170	ae072450-3c5b-4229-876f-b417cf2c4db5	PENDING	Pagamento iniciado via Mercado Pago	2025-04-17 00:32:09.503
9eae1d77-1857-46f2-a300-95ee69922ad5	bc254d1f-7ad2-4e40-8b08-184f15652fb1	PENDING	Pagamento iniciado via Mercado Pago	2025-04-17 00:37:02.614
b4e31c3d-437b-460c-90c8-bc657168b1e7	515123f1-76f1-4efe-9197-b5132a9e1947	PENDING	Pagamento iniciado via Mercado Pago	2025-04-17 00:44:31.766
199f299d-1ba4-406b-a0b0-f0c2d070e732	154816db-fea6-4982-8d51-ac507261777f	PENDING	Pagamento iniciado via Mercado Pago	2025-04-17 01:49:11.735
31975cfa-b429-42e7-95c4-129dae1f7aad	7780f1e8-226a-4bb3-b3c8-5385e1d8b9c6	PENDING	Pagamento iniciado via Mercado Pago	2025-04-17 02:05:55.112
0cf2b951-1777-4c75-a920-89b67258fead	561f4ef4-889c-4d4b-92a0-0c606cdd05e8	PENDING	Pagamento iniciado via Mercado Pago	2025-04-17 02:11:02.718
4a945274-e290-4b50-9093-c90a49b37b6c	63cfbcc6-6e7d-410d-aa84-cf8c46305d6f	PENDING	Pagamento iniciado via Mercado Pago	2025-04-17 02:26:24.666
def8e7d7-864e-4fd5-9535-1b2a56f75156	a31f907a-29ab-49bc-b70d-04953206dd50	PENDING	Pagamento iniciado via Mercado Pago	2025-04-17 02:28:37.105
861b13eb-7178-426e-949e-cbe2185627dd	55f7351b-dbf2-4e22-ad5c-c517a51419b0	PENDING	Pagamento iniciado via Mercado Pago	2025-04-17 02:36:22.498
432feba5-cda4-4283-8598-2b34b7e47e39	7f1af501-580e-4989-abe5-0bb26cbc975e	PENDING	Pagamento iniciado via Mercado Pago	2025-04-17 02:39:32.519
ab21c2f4-4546-4191-9cbc-493f3804f1ad	d0b5bcdd-c878-4812-8ac9-bfbae940b0b1	PENDING	Pagamento iniciado via Mercado Pago	2025-04-17 02:42:16.351
342d1a0d-b7c6-4fa0-a2c0-69035b690cef	a484b10c-f9e3-4f1a-ab94-a1702389623f	PENDING	Pagamento iniciado via Mercado Pago	2025-04-17 13:40:26.904
f4e7fdb0-3824-4bd4-9ba1-6956dbd2c5cf	0a824727-2dc5-4c28-8969-34b29c7ab2ff	PENDING	Pagamento iniciado via undefined	2025-04-17 18:51:17.998
a8059164-7b12-4a55-a689-8e74a1b89cff	71d734fe-2b23-43ca-96fe-028e955c034c	PENDING	Pagamento iniciado via undefined	2025-04-17 18:57:56.555
ab705855-9729-4318-85bb-73bb60195040	246be59d-5ea5-4b1c-98c9-b811bfb7ca52	PENDING	Pagamento iniciado via undefined	2025-04-17 19:05:16.179
bb480267-58fd-419b-9366-069475faaaf2	520f8db8-3093-48dc-93e2-e4dc8f48fa88	PENDING	Pagamento iniciado via undefined	2025-04-17 19:06:50.085
208f3f12-ddd0-4ea0-9875-30b20fc575c1	34c422a7-5aa7-4334-8477-1c7bba227810	PENDING	Pagamento iniciado via undefined	2025-04-17 19:13:05.698
734ba259-877e-407f-9125-188a6f83f191	a419b843-8efd-4d23-a183-bb78b3a5a976	PENDING	Pagamento iniciado via undefined	2025-04-17 19:51:23.692
db5b4623-dcce-4016-97e0-3a4746bff384	a751e0fc-170b-4a8a-80e7-5173c69aef04	PENDING	Pagamento iniciado via undefined	2025-04-19 14:57:21.004
f946988e-0dbe-4002-a628-aa8eae028af1	878d85cb-35d6-4cb0-9285-007d36473cd8	PENDING	Pagamento iniciado via undefined	2025-04-19 15:02:04.175
3cad2c82-bc56-496d-a146-cf2e7eab8d54	993dcf95-48f0-465e-b8e6-dd9b2325d4cc	PENDING	Pagamento iniciado via undefined	2025-04-19 15:31:26.406
f3af0c4a-ae33-4e90-9d68-5548e5833457	b5d83d47-4714-44aa-a150-f76e665fdc95	PENDING	Pagamento iniciado via PagSeguro	2025-04-19 19:14:36.556
c78c6341-130e-41da-ac46-2978c1393cf9	abaecd90-811f-4f12-a327-1a70e41df35f	PENDING	Pagamento iniciado via PagSeguro	2025-05-20 14:45:59.278
01f83d91-88d8-4962-865e-f8cc2278ff4c	1db8473e-b47a-4a70-a075-debd45ede2b9	PENDING	Pagamento iniciado via PagSeguro	2025-05-20 14:53:48.724
a82c6117-9d7a-4d2c-b0d5-4174dcc89b97	ecd0975a-3fbc-4303-8c42-9ad28906da98	PENDING	Pagamento iniciado via PagSeguro	2025-05-20 16:09:02.947
a69099df-1179-4297-82aa-17e944dada0d	171c8829-44eb-4fc4-a9ab-b376e243ca54	PENDING	Pagamento iniciado via PagSeguro	2025-05-20 17:58:04.858
eb4988cd-cbd3-4fb0-b0e3-cae846c08d80	f63afef3-5740-44ea-a083-9525e4cc3d46	PENDING	Pagamento iniciado via PagSeguro	2025-05-20 19:02:44.6
4ee05b90-268d-41c6-9cac-0b569a1b22c7	13f5f760-b3d2-47e8-b5e2-91b079c52349	PENDING	Pagamento iniciado via PagSeguro	2025-05-21 01:01:29.236
\.


--
-- Data for Name: PaymentTransaction; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."PaymentTransaction" (id, "gatewayConfigId", "entityId", amount, description, "paymentMethod", "paymentUrl", "externalId", metadata, "expiresAt", "paidAt", "canceledAt", "createdAt", "updatedAt", "athleteId", protocol, status, "entityType") FROM stdin;
df133370-3147-4bc6-a703-ede0fa1589b6	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	PIX	\N	\N	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "637e44c3-f9cc-459a-819d-4cbf3baea614"}	\N	\N	\N	2025-03-31 21:34:09.207	2025-03-31 21:34:09.206	\N	EVE-20250331-6426	PENDING	EVENT_REGISTRATION
ac239763-0f68-47c4-a5fb-7213e8996723	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	PIX	\N	\N	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "0a4801a7-8f10-462b-9462-5580a1b7258d"}	\N	\N	\N	2025-03-31 21:38:24.751	2025-03-31 21:38:24.749	\N	EVE-20250331-1728	PENDING	EVENT_REGISTRATION
0023d9a6-68d9-4bb2-b66c-fe82f55f4378	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	PIX	\N	\N	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "15961da5-caf7-4f11-b43f-23aadf021690"}	\N	\N	\N	2025-03-31 21:42:12.994	2025-03-31 21:42:12.993	\N	EVE-20250331-7519	PENDING	EVENT_REGISTRATION
7d33b5d2-0a92-4ebb-bf1b-b5fc551c5b6e	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	PIX	\N	\N	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "1ee9d796-8647-48e9-b082-f65e1fe70f33"}	\N	\N	\N	2025-03-31 21:45:56.589	2025-03-31 21:45:56.587	\N	EVE-20250331-7043	PENDING	EVENT_REGISTRATION
ec9163be-56b8-4f89-b046-2254161d940f	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	PIX	https://www.mercadopago.com.br/sandbox/payments/1322849290/ticket?caller_id=2361029597&hash=1c2fa5c4-60d4-4ac2-ac41-488bda792d18	1322849290	{"type": "EVENT", "qrCode": "00020126580014br.gov.bcb.pix0136b76aa9c2-2ec4-4110-954e-ebfe34f05b615204000053039865406120.005802BR5911SEbRtg JPHO6008GoxRYqia62230519mpqrinter1322849290630484F5", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "qrCodeBase64": "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", "registrationId": "a6bf47e5-d6d1-45d3-b8cb-a1d30e7e40b5"}	\N	\N	\N	2025-03-31 21:50:40.959	2025-03-31 21:50:42.924	\N	EVE-20250331-4161	PENDING	EVENT_REGISTRATION
0b00e6b7-a4d4-4301-b68d-b1fd6893d30d	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	PIX	https://www.mercadopago.com.br/sandbox/payments/1322848912/ticket?caller_id=2361029597&hash=ec26e199-9588-4aa6-94bd-96776f2b59fc	1322848912	{"type": "EVENT", "qrCode": "00020126580014br.gov.bcb.pix0136b76aa9c2-2ec4-4110-954e-ebfe34f05b615204000053039865406120.005802BR5911SEbRtg JPHO6008GoxRYqia62230519mpqrinter13228489126304C1C8", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "qrCodeBase64": "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", "registrationId": "6f105d8c-f63b-44a9-bd8c-69bc15aa238b"}	\N	\N	\N	2025-03-31 21:52:47.332	2025-03-31 21:52:48.743	\N	EVE-20250331-6569	PENDING	EVENT_REGISTRATION
d9a05e48-4d4c-4ef4-ac07-9f0d4e7f2f27	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	PIX	https://www.mercadopago.com.br/sandbox/payments/1334101963/ticket?caller_id=2361029597&hash=8735355a-7d1f-48bd-8e1b-d00c09a67616	1334101963	{"type": "EVENT", "qrCode": "00020126580014br.gov.bcb.pix0136b76aa9c2-2ec4-4110-954e-ebfe34f05b615204000053039865406120.005802BR5911SEbRtg JPHO6008GoxRYqia62230519mpqrinter13341019636304B1B1", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "qrCodeBase64": "iVBORw0KGgoAAAANSUhEUgAABWQAAAVkAQAAAAB79iscAAAObElEQVR4Xu3XXZKjq46FYc/gzH+WewbuSP2whIR9OjqS2nb1uy5cgIR4vryrx/OL8s+jn3xy0N4L2ntBey9o7wXtvaC9F7T3gvZe0N4L2ntBey9o7wXtvaC9F7T3gvZe0N4L2ntBey9o7wXtvaC9F7T3gvZe0N4L2ntBey9o7wXtvaC9F7T3gvZe0N4L2ntBey9o7wXtvaC9F7T3UrWPnv/8nNlPbqMvVz/3H/GTsVY7i5X6rKp56rN5uVI1Ul9by2MbWrTehhatt6FF621o0XobWrTehhatt32yVufa6tmUVbcVchXZvqqevfi0oT0xLGjRetCi9aBF60GL1oMWrQctWs+Xa3X/dKu2ZKK+fUutbsZT9fRu26431vJdm6poD++27XpjLd+1qYr28G7brjfW8l2bqmgP77btemMt37WpivbwbtuuN9byXZuqaA/vtu16Yy3ftamK9vBu26431vJdm6poD++27XpjLd+1qYr28G7brjfW8l2bqmgP77btemMt37Wp+vnaWOWLTXbe6lqubG702UqF048F7Wmra7myuWjRoj22oUVbCminEe2JhxbtcatrubK5aNH+CW0MTk/05WM1qWix2vgMK+gjZ3McoLWgRetBi9aDFq0HLVoPWrQetH+Ztm1jyKatT7Qb21ldteiPscnatbFFO59d7Rm0aFcLWpuDFi3aaEFrc9CiRRstaG3Oh2pb2sw/9jMZaH/rZzLQ/tbPZKD9rZ/JQPtbP5OB9rd+JgPtb/1MBtrf+pkMtL/1Mxlof+tnMr5ee479jzGHxDZXqlr0orYt1WPV7b+mpfEYtGg9aNF60KL1oEXrQYvWgxat55u1SVHsOFaqJkqF090qe5y/7/S55zMLWgWtMl+041ihPcpOZxa0ClplvmjHsUJ7lJ3OLGgVtMp80Y5jhfYoO51Z0CpolfmiHcfq07RxlGc5XbX6trYbytLu1hfz2sC35vk4WgtaO6u7OEKrGWjXCu3egtZSPdqiPTyO1oLWzuoujtBqBtq1Qru3/N+0dYht5xOSjULejRbdtTPLVKxSVpUTAy3aPFtLtD9Ba+cPtGjt/IEWrZ0/0KK18wdatHb++CKtog4NE2VExq0vLgovd6ZN0erVQ/3kJ2izb0ubotWrh/rJT9Bm35Y2RatXD/WTn6DNvi1tilavHuonP0GbfVvaFK1ePdRPfoI2+7a0KVq9eqif/ARt9m1pU7R69VA/+Qna7NvSpmj16qF+8hO02belTdHq1UP95Cdos29Lm6LVq4f6yU++QavBdVw+ES0Wvb3dOL9jClFmof5ttk8b89CizRtriTb60KL1PrRovQ8tWu9Di9b70H6XVrJ4+3ngzWqs9JF6LAs1bUr7DP1tzt+377ZJzwE4VWOFtgct2qzuu23ScwBO1Vih7UGLNqv7bpv0HIBTNVZoe9Cizeq+2yY9B+BUjRXaHrR/SvtcgNNMO9PbasmzILftywHWomzXIuPJtfTYRbRzgLUoaNEepkTGk2vpsYto5wBrUdCiPUyJjCfX0mMX0c4B1qKgRXuYEhlPrqXHLqKdA6xFQfsxWruzzo+ruNpW+VgMSJmq7etH83O5s6Aq2gFAixbtEqwl2qihjY44P67QovUVWrS+QovWVx+krdOf+y3bTp6uDY9igI1XVyrkG5ocnWjRetCi9aBF60GL1oMWrQctWs/foK1DtvsaXLMZa8v2Qaq2D9KgU0tsW9Ci9aBF60GL1oMWrQctWg9atJ4v16pXPBWiamcbRStVNaU2W+ZfpA44/Qni2lqi/TlFa7cyaNEe21SIqp2hRetnaNH6GVq0foYWrZ/9y1q11cdO25Ym01kObSu12L/v8WjRon2gRZtBWwpo0aJFWwto0f492rhivfmz2kri2e1HzeOunVnm5HqWk2s1r0XQovWgRetBi9aDFq0HLVoPWrSe79VWlHXo6lYYLz7qOw0QVY1XoaGsb2uJuoIWrQctWg9atB60aD1o0XrQovV8r1b3K1TZ8PXMsn2fzsb2ESi73j5cZ5HGQIs2t2v5rq2doV15w0CLNrdr+a6tnaFdecNAiza3a/murZ2hXXnDQIs2t2v5rq2dfYw2BttMO7Nopr2zDTmhItm8DsoUS/vwaMnkpRW0aD1o0XrQovWgRetBi9aDFq3ne7U16anQ58DHzO0LxjspU3Mlb1NOr5VJaOcTJWjRetCi9aBF60GL1oMWrQft12h1NQ40Pbfqi+SLltV5eizvpnaMb9UWtJm2RRtPoEXrT6BF60+gRetPoEXrT6BF6098k7YBLFG1Qv5E9OL2RFxs39Ja8lptsczPQLtOj6NGC9oHWmtB+0BrLWgfaK0F7QOttaB9oLUWtI9P1GZHvfVc21M132kvtm+RsX1p3NUqm2tLHbWWtvM2DbFo0qiiRVtuqKqgRetBi9aDFq0HLVoPWrSe61pRajR909ZkdZAtOcA2o2XiX1bRjqC13hcUtL0agha0aA9VtCNorfcFBW2vhqAFLdpDFe0I2tar+6JkS/avG/ODojpX9Zv14bPPjvVuBO3pbbQKWg9atB60aD1o0XrQovWg/XztmJTjmqL1WdqqUrbUAbmt9fb49gZatBm0aPPaWtpuXrCZaNe21icULVq0HrRoPWjRev4NbRz5LcsZlY9ZomRVi5rV8s+A1qoK2916LVrqLo62W2j31AJatP1dK6DNxAHabKm7ONpuod1TC2jR9netgDYTB2izpe7iaLuFdk8t/L3aOclSC4mPwnOgRrbmuJHf3Lbj2vanQjuCNnbHoPXX2nZcQ5s5D0Abu2PQ+mttO66hzZwHoI3dMWj9tbYd19BmzgPQxu6YD9fqpA62al49P/GoXzAGZFpzLVSZP1nKaL2qFdrY9SFo0XrQovWgRetBi9aDFq3nc7UaEmme/+wKW20z1VcL+ZH1RkY3YtW2tqpfMK4qaNGuXrTzSbRo141YtS1atGWFVgPQetCi9aD9g1rxVkfZ6mr9Fs1U8/YFcUfbSY61CtuXrrO1RIs2okntvrZo0aLdzyxotUJbVmjRokVbV2j/Fa06bBMPqzdzgsZPUhTd0LZSXpzpBlq0U4AWbbaspe3QovUdWrS+Q4vWd2jR+u57tGOmRfh6q3xQdWfefPNpXitsA2rQbo/Fweku2tP0ORgtWrRo0VphG1CDdnssDk530Z6mz8Fo0aL9X2tjlU+MdzSkGbe326hozr6o5tmo2tkchdaC1m6czutVtGjRoq1X0aJFi7ZeRYv2s7X1ll1InqbX7XN81Zmc37cGZ9rfQavtM1aTVfddyeCh9aBF60GL1oMWrQctWg9atB60n6Udj82ZMSS3qzSreXYqjK+36rs/RgTtdnYqoD30erRdpVnNs1MB7aHXo+0qzWqenQpoD70ebVdpVvPsVEB76PVou0qzmmenAtpDr0fbVZrVPDsV0B56Pdqu0qzm2amA9tDr0XaVZjXPTgW0h16Ptqs0q3l2Kvw/1FqsWMfNxBB7wrZ5o56pRVNSVt/IAa3l9JFoRwvaDFq0HrRoPWjRetCi9aBF6/kabX1Wb9tjpxct+iorbAqLdala00ZZtj/VmIcWbd5YS7RoI2jRetCi9aBF60GL1vNd2tGRRpujltGXhfpiW2m7ncX4bcpae9Ci9aBF60GL1oMWrQctWg9atJ6/Q1tnapzuJ1TauDYBtbAZ6902Kj/3ND6CNoN2LdGiXecWtGg9aNF60KL1oEXr+RJtvTC3ddKW8Ww2N8UJFc3CK80SZ/tu60CL9rCNFVq0vkKL1ldo0foKLVpfoUXrq0/V6u2X28rLbYywbNXqmdD27rhrQaugVeYt5bRFe5wcQaugVeYt5bRFe5wcQaugVeYt5bRFe5wcQaugVeYt5bT9N7X1qnr1bBYqauPp2XbWeLqmaj3bgtaCFq0HLVoPWrQetGg9aNF60P4lWj1WV896IU6z0N5p1baqz1rm11d83kCrgqpthVa3YvVEa0H7RGtB+0RrQftEa0H7RGtB+/xQ7aG4PaFJ2xNKvbG9OBSP9bnPAVVhBC1aD1q0HrRoPWjRetCi9aBF6/leraUOFCrJGlwLeicfazf0aXHaUNun1ebx9yqXfrLubVfRlqDNKtoMWrSlDy1atGhrH1q0aD9C2y60me/JOmtPRGGLnSm1tH3zCFq0HrRoPWjRetCi9aBF60GL1vP12rwv8vntnNle1JTI6YNOA+yhLVHNx9FqSgStnZ/a0B4HoM3qeCyjKRG0dn5qQ3scgDar47GMpkTQ2vmpDe1xANqsjscymhJBa+entk/VnlKvyt0GJ0Vb3S2zVvQF2r75syho37/4RBuRAW3ZokWLFm3dokWLFm3dov0grd6LbIralzPHWb6ou6rG9p+hGH3zbgTtixdji9aCFq0HLVoPWrQetGg9aNF6Ply7Kc5XTwBLKjTl9LnjTPj80ujLGzVo0XrQovWgRetBi9aDFq0HLVrPl2tjzAaNITYus+7Pz1DmgIaKG9sXRNpdC1plDkCLNpvRokVbeudjyrqPNlq0iqBV5gC0aLMZLdo/oZ3QNr0O2M5iLaj6XuDru5qC1gZsZ7FGm+d6Am32oUXrBbRovYAWrRfQovUC2i/Utq3wGtKSCvVVQHPnWV1NfAQtWg9atB60aD1o0XrQovWgRev5cm3b1quZOlPvbNcqauLbmfoikxFBi9aDFq0HLVoPWrQetGg9aNF6vlnb0gZbi33B47+/s/HihppPnvYF56FriTbO4oaa0aJFW9rQou1DrAVtfwgtWrQ/QYv2Q7SfH7T3gvZe0N4L2ntBey9o7wXtvaC9F7T3gvZe0N4L2ntBey9o7wXtvaC9F7T3gvZe0N4L2ntBey9o7wXtvaC9F7T3gvZe0N4L2ntBey9o7wXtvaC9F7T3gvZe0N4L2ntBey9o7wXtvXyZ9n8A0JvmHV1KzRsAAAAASUVORK5CYII=", "registrationId": "f468c5b9-23e8-4e96-b420-6c5d3751a836"}	\N	\N	\N	2025-03-31 21:58:57.346	2025-03-31 21:58:59.519	\N	EVE-20250331-4407	PENDING	EVENT_REGISTRATION
efc84b3e-28d0-495f-b2cf-4eaf7c5198c9	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	PIX	https://www.mercadopago.com.br/sandbox/payments/1334102005/ticket?caller_id=2361029597&hash=8702bbf1-307a-4f6e-a493-2fd50e6dfc57	1334102005	{"type": "EVENT", "qrCode": "00020126580014br.gov.bcb.pix0136b76aa9c2-2ec4-4110-954e-ebfe34f05b615204000053039865406120.005802BR5911SEbRtg JPHO6008GoxRYqia62230519mpqrinter13341020056304126C", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "qrCodeBase64": "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", "registrationId": "f468c5b9-23e8-4e96-b420-6c5d3751a836"}	\N	\N	\N	2025-03-31 22:02:43.885	2025-03-31 22:02:45.116	\N	EVE-20250331-9888	PENDING	EVENT_REGISTRATION
b9a40b54-e219-4de4-9b78-5df032296939	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	PIX	https://www.mercadopago.com.br/sandbox/payments/1322849442/ticket?caller_id=2361029597&hash=ff7db66c-0739-4c53-bf37-b415ac13e8e9	1322849442	{"type": "EVENT", "qrCode": "00020126580014br.gov.bcb.pix0136b76aa9c2-2ec4-4110-954e-ebfe34f05b615204000053039865406120.005802BR5911SEbRtg JPHO6008GoxRYqia62230519mpqrinter132284944263042F10", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "qrCodeBase64": "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", "registrationId": "01985eff-b984-4445-b0cd-dedc84fe5a6a"}	\N	\N	\N	2025-03-31 22:07:46.741	2025-03-31 22:07:48.221	\N	EVE-20250331-1866	PENDING	EVENT_REGISTRATION
aaddad28-22c8-42c3-8ec9-2b3065da923f	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	CREDIT_CARD	\N	\N	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "f2cb634b-165f-4621-a587-d5228f099caa"}	\N	\N	\N	2025-03-31 22:26:33.883	2025-03-31 22:26:33.881	\N	EVE-20250331-5839	PENDING	EVENT_REGISTRATION
b56bd777-dd33-4619-8a9e-5defc102b20e	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	CREDIT_CARD	\N	\N	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "70adef02-0800-474f-a02f-993c0aa010c1"}	\N	\N	\N	2025-03-31 22:29:57.08	2025-03-31 22:29:57.079	\N	EVE-20250331-7894	PENDING	EVENT_REGISTRATION
b79c3ad2-2c65-4e0d-bc6a-3ba310f7fcb1	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	CREDIT_CARD	\N	\N	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "591cbf04-5473-4f9d-8c1c-30f5e9c19ceb"}	\N	\N	\N	2025-03-31 22:40:36.226	2025-03-31 22:40:36.224	\N	EVE-20250331-2885	PENDING	EVENT_REGISTRATION
1ae2143d-4a21-47de-8b5f-d34023dc89be	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	CREDIT_CARD	\N	\N	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "7b83d2a3-f316-4a06-8ba9-a1c0f8b52e7a"}	\N	\N	\N	2025-03-31 22:46:24.415	2025-03-31 22:46:24.413	\N	EVE-20250331-1445	PENDING	EVENT_REGISTRATION
af359517-2869-4765-9db1-a50f239d65c9	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	CREDIT_CARD	\N	af359517-2869-4765-9db1-a50f239d65c9	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "04486402-5b5f-4b20-873b-2c876520982a"}	\N	\N	\N	2025-03-31 22:58:14.193	2025-03-31 22:58:14.206	\N	EVE-20250331-2449	PENDING	EVENT_REGISTRATION
e00dcbb2-a683-449c-8017-542aaea23827	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	CREDIT_CARD	\N	e00dcbb2-a683-449c-8017-542aaea23827	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "4e3bf419-2adc-4646-9305-88f8be3f5382"}	\N	\N	\N	2025-03-31 23:08:11.867	2025-03-31 23:08:11.879	\N	EVE-20250331-3515	PENDING	EVENT_REGISTRATION
2cb6d788-cd3f-4c78-bb5e-80343cfba7cf	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	PIX	https://www.mercadopago.com.br/sandbox/payments/1322859428/ticket?caller_id=2361029597&hash=c3e984d4-9309-4eea-990f-a2950b94884a	1322859428	{"type": "EVENT", "qrCode": "00020126580014br.gov.bcb.pix0136b76aa9c2-2ec4-4110-954e-ebfe34f05b615204000053039865406120.005802BR5911SEbRtg JPHO6008GoxRYqia62230519mpqrinter132285942863040F7C", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "qrCodeBase64": "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", "registrationId": "71374590-4bfb-4094-b5cf-d9c68569aafd"}	\N	\N	\N	2025-04-01 16:43:41.104	2025-04-01 16:43:42.433	\N	EVE-20250401-3943	PENDING	EVENT_REGISTRATION
fd464c37-412e-426f-807e-4c641f8b10cb	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	CREDIT_CARD	\N	fd464c37-412e-426f-807e-4c641f8b10cb	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "71374590-4bfb-4094-b5cf-d9c68569aafd"}	\N	\N	\N	2025-04-01 17:09:14.44	2025-04-01 17:09:14.453	\N	EVE-20250401-4902	PENDING	EVENT_REGISTRATION
369ded0a-6700-401c-a94c-4a7ad55674d3	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - MASTER A1	CREDIT_CARD	\N	369ded0a-6700-401c-a94c-4a7ad55674d3	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7rozpt0001dkja8xwj9pz3t", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "72f40157-fd60-40b6-bc25-b587f501e2a2"}	\N	\N	\N	2025-04-01 17:30:18.683	2025-04-01 17:30:18.695	\N	EVE-20250401-1465	PENDING	EVENT_REGISTRATION
882e7bed-6630-4a44-ab4c-eba1c60589fc	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - MASTER B1	CREDIT_CARD	\N	882e7bed-6630-4a44-ab4c-eba1c60589fc	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7rp048e001hkja8vroa1n5u", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "8e35a315-1f86-4ef2-9aa4-2b4f0b57c38f"}	\N	\N	\N	2025-04-01 19:06:15.524	2025-04-01 19:06:15.539	\N	EVE-20250401-8532	PENDING	EVENT_REGISTRATION
73f52294-0e47-4fd2-bce3-dffb5e188237	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	CREDIT_CARD	\N	73f52294-0e47-4fd2-bce3-dffb5e188237	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "701edfc1-f7c3-4280-97e7-b8b783d0e010"}	\N	\N	\N	2025-04-01 19:17:19.224	2025-04-01 19:17:19.237	\N	EVE-20250401-1946	PENDING	EVENT_REGISTRATION
9f5e3b88-a16e-4572-b9a8-8ceaf5c0dea3	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - ELITE	CREDIT_CARD	\N	9f5e3b88-a16e-4572-b9a8-8ceaf5c0dea3	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "68da2e0f-84ac-41bd-b910-59bdd98b208f"}	\N	\N	\N	2025-04-01 19:26:25.674	2025-04-01 19:26:25.687	\N	EVE-20250401-8988	PENDING	EVENT_REGISTRATION
56333b6a-8a56-4642-8265-c55c87e2d9cc	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - MASTER A2	CREDIT_CARD	\N	56333b6a-8a56-4642-8265-c55c87e2d9cc	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7rozxdt001fkja85fwmw6rt", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "5b67230c-e83d-4319-bdd7-f6c362f80400"}	\N	\N	\N	2025-04-01 20:39:06.398	2025-04-01 20:39:06.411	\N	EVE-20250401-7682	PENDING	EVENT_REGISTRATION
3bc35e17-ba6b-4fbf-81a8-2cc157d7fcbf	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - MASTER C1	PIX	\N	\N	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7rp0ik2001lkja8dp1tbtvy", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "94dd2bd5-f21a-4996-92ab-31b8dbe4c70e"}	\N	\N	\N	2025-04-01 22:13:34.995	2025-04-01 22:13:34.994	\N	EVE-20250401-6403	PENDING	EVENT_REGISTRATION
8bd57e41-38b7-4905-b6e5-1d48d6b61130	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - MASTER D2	PIX	\N	\N	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7rp18tl001rkja89pu01awm", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "5152e1a6-3112-40ae-8dae-d19a9f172ff5"}	\N	\N	\N	2025-04-05 21:03:57.36	2025-04-05 21:03:57.358	\N	EVE-20250405-7537	PENDING	EVENT_REGISTRATION
6b50130b-61ca-4317-b157-8949d652db33	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - JUVENIL	PIX	\N	\N	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roz6ts0019kja87dvw52z6", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "0db27ede-96b7-4e42-a2e5-a1ccd5f5ff6b"}	\N	\N	\N	2025-04-05 21:07:28.214	2025-04-05 21:07:28.212	\N	EVE-20250405-4009	PENDING	EVENT_REGISTRATION
0a99b433-e282-491f-8aaf-44d09f8a4007	02457dc9-9a31-4682-bd65-63db91d84fa9	8bbe50ee-952a-427b-9564-bcae8c1cec5c	120.00	Inscrição em Mountain Bike - MASTER C2	PIX	\N	\N	{"type": "EVENT", "tierId": "cf0ffb37-8dc4-465b-8cd7-a83d9bedfe5e", "entityId": "8bbe50ee-952a-427b-9564-bcae8c1cec5c", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7rp0oo7001nkja86gxix7y5", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "ea842b7d-31ca-4831-acee-76fe17a018ca"}	\N	\N	\N	2025-04-05 21:12:07.103	2025-04-05 21:12:07.101	\N	EVE-20250405-5859	PENDING	EVENT_REGISTRATION
d764d2f5-6fdc-46e5-8163-53c82593b8ca	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	\N	\N	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-16 23:50:56.965	2025-04-16 23:50:56.963	\N	EVE-20250416-8528	PENDING	EVENT_REGISTRATION
72bba72c-578d-4c0c-afe0-f65aa7016560	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	\N	\N	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-16 23:54:06.648	2025-04-16 23:54:06.646	\N	EVE-20250416-3744	PENDING	EVENT_REGISTRATION
067a08be-e6bf-4120-a126-d89c69ed93aa	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	\N	\N	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 00:05:57.341	2025-04-17 00:05:57.339	\N	EVE-20250416-7519	PENDING	EVENT_REGISTRATION
c3ae28e8-8de0-4386-b56b-fdd12eb822fc	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	\N	\N	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 00:17:11.176	2025-04-17 00:17:11.174	\N	EVE-20250416-7968	PENDING	EVENT_REGISTRATION
5a15ccd9-a270-4ff0-aa2a-b374ad663999	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	\N	\N	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 00:18:38.784	2025-04-17 00:18:38.783	\N	EVE-20250416-8766	PENDING	EVENT_REGISTRATION
5c718e6d-d652-46b5-a7fc-bf4eb0528bb1	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	\N	126602599-e982b096-25ea-4aa2-b6a3-77ecbf212de3	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 00:25:35.326	2025-04-17 00:25:36.528	\N	EVE-20250416-5462	PENDING	EVENT_REGISTRATION
ae072450-3c5b-4229-876f-b417cf2c4db5	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=126602599-1845518a-5059-4cac-bb7e-8aba2bf8e7a0	126602599-1845518a-5059-4cac-bb7e-8aba2bf8e7a0	{"type": "EVENT", "qrCode": "126602599-1845518a-5059-4cac-bb7e-8aba2bf8e7a0", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "qrCodeBase64": "", "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 00:32:08.316	2025-04-17 00:32:09.399	\N	EVE-20250416-7205	PENDING	EVENT_REGISTRATION
bc254d1f-7ad2-4e40-8b08-184f15652fb1	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=126602599-228205cb-e9c2-4245-8086-176eb7768adf	126602599-228205cb-e9c2-4245-8086-176eb7768adf	{"type": "EVENT", "qrCode": "126602599-228205cb-e9c2-4245-8086-176eb7768adf", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "qrCodeBase64": "https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=126602599-228205cb-e9c2-4245-8086-176eb7768adf&choe=UTF-8", "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 00:37:01.24	2025-04-17 00:37:02.585	\N	EVE-20250416-5456	PENDING	EVENT_REGISTRATION
515123f1-76f1-4efe-9197-b5132a9e1947	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=126602599-05a4d120-b74c-442c-a14c-914e13a6f742	126602599-05a4d120-b74c-442c-a14c-914e13a6f742	{"type": "EVENT", "qrCode": "126602599-05a4d120-b74c-442c-a14c-914e13a6f742", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 00:44:30.562	2025-04-17 00:44:31.667	\N	EVE-20250416-6817	PENDING	EVENT_REGISTRATION
fc91fccd-5d9d-4f34-810d-fb8ba51d2287	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	\N	\N	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 00:56:40.702	2025-04-17 00:56:40.7	\N	EVE-20250416-6610	PENDING	EVENT_REGISTRATION
154816db-fea6-4982-8d51-ac507261777f	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=126602599-a9e47ddf-f59a-4658-a374-ab9b9f2d5253	126602599-a9e47ddf-f59a-4658-a374-ab9b9f2d5253	{"type": "EVENT", "qrCode": "126602599-a9e47ddf-f59a-4658-a374-ab9b9f2d5253", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 01:49:09.549	2025-04-17 01:49:11.722	\N	EVE-20250416-7567	PENDING	EVENT_REGISTRATION
440c99f1-0845-452e-beb0-7e79ac3b92f3	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	\N	\N	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 02:00:16.049	2025-04-17 02:00:16.047	\N	EVE-20250416-7502	PENDING	EVENT_REGISTRATION
7780f1e8-226a-4bb3-b3c8-5385e1d8b9c6	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=126602599-556759c0-6cf7-47c2-8680-4c145d372d3a	126602599-556759c0-6cf7-47c2-8680-4c145d372d3a	{"type": "EVENT", "qrCode": "126602599-556759c0-6cf7-47c2-8680-4c145d372d3a", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 02:05:54.034	2025-04-17 02:05:55.106	\N	EVE-20250416-5624	PENDING	EVENT_REGISTRATION
9f55cbae-4216-4473-aed0-ad64e2b4de35	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	\N	\N	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 02:08:55.547	2025-04-17 02:08:55.545	\N	EVE-20250416-5110	PENDING	EVENT_REGISTRATION
561f4ef4-889c-4d4b-92a0-0c606cdd05e8	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=126602599-a6285fa1-9214-4e89-be5e-de0bd05fb626	126602599-a6285fa1-9214-4e89-be5e-de0bd05fb626	{"type": "EVENT", "qrCode": "126602599-a6285fa1-9214-4e89-be5e-de0bd05fb626", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 02:11:01.795	2025-04-17 02:11:02.706	\N	EVE-20250416-8404	PENDING	EVENT_REGISTRATION
63cfbcc6-6e7d-410d-aa84-cf8c46305d6f	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=126602599-b4d81771-4d3d-4b5c-a061-3ad20fe7f4bf	126602599-b4d81771-4d3d-4b5c-a061-3ad20fe7f4bf	{"type": "EVENT", "qrCode": "126602599-b4d81771-4d3d-4b5c-a061-3ad20fe7f4bf", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 02:26:23.435	2025-04-17 02:26:24.654	\N	EVE-20250416-4053	PENDING	EVENT_REGISTRATION
a31f907a-29ab-49bc-b70d-04953206dd50	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=126602599-a89d7c70-9337-497b-a912-a835eda55522	126602599-a89d7c70-9337-497b-a912-a835eda55522	{"type": "EVENT", "qrCode": "126602599-a89d7c70-9337-497b-a912-a835eda55522", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 02:28:36.104	2025-04-17 02:28:37.095	\N	EVE-20250416-2284	PENDING	EVENT_REGISTRATION
55f7351b-dbf2-4e22-ad5c-c517a51419b0	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=126602599-3249e50f-dfb5-480d-8de2-b16f78f3f04d	126602599-3249e50f-dfb5-480d-8de2-b16f78f3f04d	{"type": "EVENT", "qrCode": "126602599-3249e50f-dfb5-480d-8de2-b16f78f3f04d", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 02:36:21.482	2025-04-17 02:36:22.486	\N	EVE-20250416-1768	PENDING	EVENT_REGISTRATION
7f1af501-580e-4989-abe5-0bb26cbc975e	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=126602599-52df7375-114c-46eb-a1bd-87d40b03de9e	126602599-52df7375-114c-46eb-a1bd-87d40b03de9e	{"type": "EVENT", "qrCode": "126602599-52df7375-114c-46eb-a1bd-87d40b03de9e", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 02:39:31.468	2025-04-17 02:39:32.509	\N	EVE-20250416-4970	PENDING	EVENT_REGISTRATION
d0b5bcdd-c878-4812-8ac9-bfbae940b0b1	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=126602599-fc57388d-86c9-409d-b98f-7a241bab867e	126602599-fc57388d-86c9-409d-b98f-7a241bab867e	{"type": "EVENT", "qrCode": "126602599-fc57388d-86c9-409d-b98f-7a241bab867e", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 02:42:15.292	2025-04-17 02:42:16.339	\N	EVE-20250416-4279	PENDING	EVENT_REGISTRATION
a484b10c-f9e3-4f1a-ab94-a1702389623f	02457dc9-9a31-4682-bd65-63db91d84fa9	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - ELITE	CREDIT_CARD	\N	a484b10c-f9e3-4f1a-ab94-a1702389623f	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "c820ade8-2692-4375-bab5-1292017a86e9"}	\N	\N	\N	2025-04-17 13:40:26.878	2025-04-17 13:40:26.897	\N	EVE-20250417-2013	PENDING	EVENT_REGISTRATION
e0dcca75-fa89-4598-b821-98594b4e6dd8	30d933c2-5c75-40d5-907d-92a9c3a9d082	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	\N	\N	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 18:47:36.546	2025-04-17 18:47:36.545	\N	EVE-20250417-3559	PENDING	EVENT_REGISTRATION
0a824727-2dc5-4c28-8969-34b29c7ab2ff	30d933c2-5c75-40d5-907d-92a9c3a9d082	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	https://sandbox.api.pagseguro.com/orders/ORDE_C8AF960C-A447-4A64-9DE1-C01C99294FF0/pay	ORDE_C8AF960C-A447-4A64-9DE1-C01C99294FF0	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 18:51:16.02	2025-04-17 18:51:17.984	\N	EVE-20250417-3930	PENDING	EVENT_REGISTRATION
71d734fe-2b23-43ca-96fe-028e955c034c	30d933c2-5c75-40d5-907d-92a9c3a9d082	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	https://sandbox.api.pagseguro.com/orders/ORDE_2172BD42-C3CC-4925-AA0E-FD1649608861/pay	ORDE_2172BD42-C3CC-4925-AA0E-FD1649608861	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 18:57:54.338	2025-04-17 18:57:56.544	\N	EVE-20250417-5857	PENDING	EVENT_REGISTRATION
246be59d-5ea5-4b1c-98c9-b811bfb7ca52	30d933c2-5c75-40d5-907d-92a9c3a9d082	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	https://sandbox.api.pagseguro.com/orders/ORDE_5284F534-5CFA-40A9-BCC3-30F553FF961A/pay	ORDE_5284F534-5CFA-40A9-BCC3-30F553FF961A	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 19:05:13.677	2025-04-17 19:05:16.17	\N	EVE-20250417-1848	PENDING	EVENT_REGISTRATION
520f8db8-3093-48dc-93e2-e4dc8f48fa88	30d933c2-5c75-40d5-907d-92a9c3a9d082	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	https://sandbox.api.pagseguro.com/orders/ORDE_317DD691-F885-4F2A-94B6-10EA704C3E60/pay	ORDE_317DD691-F885-4F2A-94B6-10EA704C3E60	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 19:06:48.228	2025-04-17 19:06:50.075	\N	EVE-20250417-9660	PENDING	EVENT_REGISTRATION
34c422a7-5aa7-4334-8477-1c7bba227810	30d933c2-5c75-40d5-907d-92a9c3a9d082	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	PIX	https://sandbox.api.pagseguro.com/orders/ORDE_71E98848-FF41-427C-BCE2-4E786CEB11AE/pay	ORDE_71E98848-FF41-427C-BCE2-4E786CEB11AE	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 19:13:03.498	2025-04-17 19:13:05.688	\N	EVE-20250417-4208	PENDING	EVENT_REGISTRATION
a419b843-8efd-4d23-a183-bb78b3a5a976	30d933c2-5c75-40d5-907d-92a9c3a9d082	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-23	CREDIT_CARD	\N	a419b843-8efd-4d23-a183-bb78b3a5a976	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "52c9b28e-4b0c-490b-bccb-a845382b8c24"}	\N	\N	\N	2025-04-17 19:51:23.67	2025-04-17 19:51:23.684	\N	EVE-20250417-7821	PENDING	EVENT_REGISTRATION
a751e0fc-170b-4a8a-80e7-5173c69aef04	30d933c2-5c75-40d5-907d-92a9c3a9d082	691d086a-beb3-4e05-ac65-e81efccdb807	102.00	Inscrição em Mountain Bike - SUB-30	PIX	https://sandbox.api.pagseguro.com/orders/ORDE_F284669A-185D-4435-8461-267E0EB4D7F9/pay	ORDE_F284669A-185D-4435-8461-267E0EB4D7F9	{"type": "EVENT", "tierId": "temp-1745073067438", "entityId": "691d086a-beb3-4e05-ac65-e81efccdb807", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "8ee4e740-3226-4608-8611-0932066baee1", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "55a5b8c2-b24b-43bd-af62-be8c8065f4ca"}	\N	\N	\N	2025-04-19 14:57:16.532	2025-04-19 14:57:20.994	\N	EVE-20250419-2645	PENDING	EVENT_REGISTRATION
878d85cb-35d6-4cb0-9285-007d36473cd8	30d933c2-5c75-40d5-907d-92a9c3a9d082	691d086a-beb3-4e05-ac65-e81efccdb807	102.00	Inscrição em Mountain Bike - SUB-30	CREDIT_CARD	\N	878d85cb-35d6-4cb0-9285-007d36473cd8	{"type": "EVENT", "tierId": "temp-1745073067438", "entityId": "691d086a-beb3-4e05-ac65-e81efccdb807", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "8ee4e740-3226-4608-8611-0932066baee1", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "55a5b8c2-b24b-43bd-af62-be8c8065f4ca"}	\N	\N	\N	2025-04-19 15:02:04.154	2025-04-19 15:02:04.168	\N	EVE-20250419-2759	PENDING	EVENT_REGISTRATION
993dcf95-48f0-465e-b8e6-dd9b2325d4cc	30d933c2-5c75-40d5-907d-92a9c3a9d082	691d086a-beb3-4e05-ac65-e81efccdb807	120.00	Inscrição em Mountain Bike - ELITE	CREDIT_CARD	\N	993dcf95-48f0-465e-b8e6-dd9b2325d4cc	{"type": "EVENT", "tierId": "temp-1745073067438", "entityId": "691d086a-beb3-4e05-ac65-e81efccdb807", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "4346e67f-9ab5-436d-8647-42d32f01304e"}	\N	\N	\N	2025-04-19 15:31:26.39	2025-04-19 15:31:26.399	\N	EVE-20250419-1725	PENDING	EVENT_REGISTRATION
b5d83d47-4714-44aa-a150-f76e665fdc95	30d933c2-5c75-40d5-907d-92a9c3a9d082	430a1b6e-a874-43a4-94f5-f9140d41e899	100.00	Inscrição em Ciclismo de Estrada - SUB-30	CREDIT_CARD	\N	b5d83d47-4714-44aa-a150-f76e665fdc95	{"type": "EVENT", "tierId": "0edf2c57-ca41-4a24-ada7-aeef0c68aa84", "entityId": "430a1b6e-a874-43a4-94f5-f9140d41e899", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "8ee4e740-3226-4608-8611-0932066baee1", "modalityId": "cm7ro2ao80001kja8o4jdj323", "installments": 1, "registrationId": "c28a8fd0-8cb9-4caa-a9f7-0061a546d191"}	\N	\N	\N	2025-04-19 19:14:36.539	2025-04-19 19:14:36.551	\N	EVE-20250419-1857	PENDING	EVENT_REGISTRATION
abaecd90-811f-4f12-a327-1a70e41df35f	30d933c2-5c75-40d5-907d-92a9c3a9d082	d8b98cd4-16f5-4845-b344-d413dfe5f2db	220.00	Inscrição em Mountain Bike - JUNIOR	CREDIT_CARD	\N	abaecd90-811f-4f12-a327-1a70e41df35f	{"type": "EVENT", "tierId": "temp-1747220911560", "entityId": "d8b98cd4-16f5-4845-b344-d413dfe5f2db", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "3524e809-1524-4219-81dd-5a6459aa1894", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "dcb3c30a-d7c3-4d55-98be-ba34fef3947b"}	\N	\N	\N	2025-05-20 14:45:59.25	2025-05-20 14:45:59.27	\N	EVE-20250520-9923	PENDING	EVENT_REGISTRATION
1db8473e-b47a-4a70-a075-debd45ede2b9	30d933c2-5c75-40d5-907d-92a9c3a9d082	d8b98cd4-16f5-4845-b344-d413dfe5f2db	220.00	Inscrição em Mountain Bike - JUNIOR	CREDIT_CARD	\N	1db8473e-b47a-4a70-a075-debd45ede2b9	{"type": "EVENT", "tierId": "temp-1747220911560", "entityId": "d8b98cd4-16f5-4845-b344-d413dfe5f2db", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "3524e809-1524-4219-81dd-5a6459aa1894", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "dcb3c30a-d7c3-4d55-98be-ba34fef3947b"}	\N	\N	\N	2025-05-20 14:53:48.705	2025-05-20 14:53:48.718	\N	EVE-20250520-2986	PENDING	EVENT_REGISTRATION
ecd0975a-3fbc-4303-8c42-9ad28906da98	30d933c2-5c75-40d5-907d-92a9c3a9d082	d8b98cd4-16f5-4845-b344-d413dfe5f2db	220.00	Inscrição em Mountain Bike - SUB-23	CREDIT_CARD	\N	ecd0975a-3fbc-4303-8c42-9ad28906da98	{"type": "EVENT", "tierId": "temp-1747220911560", "entityId": "d8b98cd4-16f5-4845-b344-d413dfe5f2db", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "4e681273-544f-46ef-8105-9c33c3fac95e", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "ecbd3132-a2eb-4a7f-8175-57a99cc3a17d"}	\N	\N	\N	2025-05-20 16:09:02.929	2025-05-20 16:09:02.941	\N	EVE-20250520-5579	PENDING	EVENT_REGISTRATION
171c8829-44eb-4fc4-a9ab-b376e243ca54	30d933c2-5c75-40d5-907d-92a9c3a9d082	d8b98cd4-16f5-4845-b344-d413dfe5f2db	220.00	Inscrição em Mountain Bike - SUB-30	CREDIT_CARD	\N	171c8829-44eb-4fc4-a9ab-b376e243ca54	{"type": "EVENT", "tierId": "temp-1747220911560", "entityId": "d8b98cd4-16f5-4845-b344-d413dfe5f2db", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "8ee4e740-3226-4608-8611-0932066baee1", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "61a9e89a-7092-4e83-bf08-951668844ae1"}	\N	\N	\N	2025-05-20 17:58:04.839	2025-05-20 17:58:04.851	\N	EVE-20250520-7485	PENDING	EVENT_REGISTRATION
f63afef3-5740-44ea-a083-9525e4cc3d46	30d933c2-5c75-40d5-907d-92a9c3a9d082	d8b98cd4-16f5-4845-b344-d413dfe5f2db	220.00	Inscrição em Mountain Bike - ELITE	CREDIT_CARD	\N	f63afef3-5740-44ea-a083-9525e4cc3d46	{"type": "EVENT", "tierId": "temp-1747220911560", "entityId": "d8b98cd4-16f5-4845-b344-d413dfe5f2db", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "cm7roxtzq0011kja8s7xxmq2n", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "08849856-1c95-4e0a-a09a-33db1462edf5"}	\N	\N	\N	2025-05-20 19:02:44.579	2025-05-20 19:02:44.594	\N	EVE-20250520-5441	PENDING	EVENT_REGISTRATION
13f5f760-b3d2-47e8-b5e2-91b079c52349	30d933c2-5c75-40d5-907d-92a9c3a9d082	d8b98cd4-16f5-4845-b344-d413dfe5f2db	180.00	Inscrição em Mountain Bike - JUNIOR	CREDIT_CARD	\N	13f5f760-b3d2-47e8-b5e2-91b079c52349	{"type": "EVENT", "tierId": "temp-1747220911560", "entityId": "d8b98cd4-16f5-4845-b344-d413dfe5f2db", "genderId": "b4f82f14-79d6-4123-a29b-4d45ff890a52", "categoryId": "3524e809-1524-4219-81dd-5a6459aa1894", "modalityId": "cm7roc93s0002kja8p293o507", "installments": 1, "registrationId": "46e14919-7ec7-4767-8176-11ae2c38417b"}	\N	\N	\N	2025-05-21 01:01:29.216	2025-05-21 01:01:29.228	\N	EVE-20250520-3161	PENDING	EVENT_REGISTRATION
\.


--
-- Data for Name: Protocol; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Protocol" (id, number, type, "entityId", "paymentId", status, metadata, year, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProtocolSequence; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."ProtocolSequence" (id, type, year, sequence, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Ranking; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Ranking" (id, "athleteId", modality, category, gender, points, "position", city, team, season, "updatedAt", "createdAt") FROM stdin;
ranking_1740524237904_r2adht1	cm7kzdd9b0002tiez8io57mt0	ROAD	ELITE	MALE	100	1	Goi├ónia	Team A	2025	2025-02-25 22:57:17.904	2025-03-09 01:19:31.811024
ranking_1740524238313_7utwwts	cm7kzddeg0005tiezgu7mny7o	ROAD	ELITE	MALE	80	2	Goi├ónia	Team B	2025	2025-02-25 22:57:18.313	2025-03-09 01:19:31.811024
ranking_1740524238365_jde7mrw	cm7kzddkr000btiezu82356es	ROAD	SUB23	MALE	100	1	Goi├ónia	Team A	2025	2025-02-25 22:57:18.365	2025-03-09 01:19:31.811024
ranking_1740524238415_16o9sp0	cm7kzddnc000etiezr7ux0g1r	ROAD	SUB23	MALE	80	2	Goi├ónia	Team B	2025	2025-02-25 22:57:18.415	2025-03-09 01:19:31.811024
c4e4cccb-bf76-4bf9-8003-976b50890027	cm7kzdd9b0002tiez8io57mt0	Ciclismo de Estrada	Elite	MALE	100	1	Goi├ónia		2025	2025-03-09 15:38:14.095	2025-03-09 15:38:14.095
e00e97ea-db67-4b8e-85b3-170004b32432	cm7kzddeg0005tiezgu7mny7o	Ciclismo de Estrada	Elite	MALE	80	2	Goi├ónia		2025	2025-03-09 15:38:14.566	2025-03-09 15:38:14.566
d5b0fa6f-acfd-4ae0-afd7-0087cb73e6db	cm7kzddh90008tiezwwcrd3b8	Ciclismo de Estrada	Elite	MALE	60	3	Goi├ónia		2025	2025-03-09 15:38:14.794	2025-03-09 15:38:14.794
b5e61e51-a4e6-40c1-85a8-22427b0ba707	cm7kzddkr000btiezu82356es	Ciclismo de Estrada	Elite	MALE	50	4	Goi├ónia		2025	2025-03-09 15:38:14.822	2025-03-09 15:38:14.822
a3090ae6-6e76-408d-9f0f-161a5c81fd0d	cm7kzddnc000etiezr7ux0g1r	Ciclismo de Estrada	Elite	MALE	45	5	Goi├ónia		2025	2025-03-09 15:38:14.86	2025-03-09 15:38:14.86
80517238-91c5-4b2f-be77-b982eb1852ca	cm7kzddpq000htiezgjh0rch1	Ciclismo de Estrada	Elite	MALE	40	6	Goi├ónia		2025	2025-03-09 15:38:14.874	2025-03-09 15:38:14.874
616e2995-b706-4295-b4b5-79afdec19ff7	cm7kzddrz000ktiezhqyu2moj	Ciclismo de Estrada	Elite	MALE	35	7	Goi├ónia		2025	2025-03-09 15:38:14.89	2025-03-09 15:38:14.89
80e4ff07-a527-4c2f-83ec-546a40094b21	cm7kzddud000ntiez55lyvek6	Ciclismo de Estrada	Elite	MALE	30	8	Goi├ónia		2025	2025-03-09 15:38:15.002	2025-03-09 15:38:15.002
11034b64-dfb6-492e-a9e6-5fcf7ecf4609	cm7kzddx1000qtiezbv0ad3bw	Ciclismo de Estrada	Elite	MALE	25	9	Goi├ónia		2025	2025-03-09 15:38:15.021	2025-03-09 15:38:15.021
cce73cb4-1808-448c-bf46-fcb0dee69221	cm7kzde07000ttiezntdlxq9h	Ciclismo de Estrada	Elite	MALE	20	10	Goi├ónia		2025	2025-03-09 15:38:15.043	2025-03-09 15:38:15.043
8eca9554-2fe6-4407-9e75-303c898c7b6c	e77ebac8-86e7-4b49-beb4-bfc443695b29	MTB	Elite	FEMININO	100	1	S├úo Paulo		2025	2025-03-19 02:19:33.946	2025-03-19 02:19:33.946
27be3871-0e44-4646-98d1-525e2aa71837	19b46922-2b89-4432-b9af-89cdb0fc175c	MTB	Elite	FEMININO	95	2	Rio de Janeiro		2025	2025-03-19 02:19:34.045	2025-03-19 02:19:34.045
0a4b2998-f982-4d0d-966c-9b35cefe6d75	f141246f-2cfb-4318-a5fa-0edd83befb4f	MTB	Elite	FEMININO	90	3	Belo Horizonte		2025	2025-03-19 02:19:34.069	2025-03-19 02:19:34.069
c8b08424-fad7-4c17-85e4-0fb32ba3bfae	94584909-5b5a-4c19-a6b2-f4a1c29465b6	MTB	Elite	FEMININO	85	4	Curitiba		2025	2025-03-19 02:19:34.092	2025-03-19 02:19:34.092
f28fe80d-126b-4a7c-ae2c-ef6e0545f4b0	9b7a05de-cd9d-48d1-ac24-b15f0b381c93	MTB	Elite	FEMININO	80	5	Porto Alegre		2025	2025-03-19 02:19:34.11	2025-03-19 02:19:34.11
32390a83-e0ac-4364-a63e-8588b741a96d	efcf00ec-2275-4cd4-853f-2a2b4cb72043	MTB	Elite	FEMININO	75	6	Bras├¡lia		2025	2025-03-19 02:19:34.137	2025-03-19 02:19:34.137
798e0f38-2843-426b-9013-f1f7df6d1324	2448b5a7-ed67-4845-8bb5-bbc2999eaff4	MTB	Elite	FEMININO	70	7	Salvador		2025	2025-03-19 02:19:34.159	2025-03-19 02:19:34.159
a103c014-33f1-488e-84c0-503390cbe9a7	47c65561-a0e3-484c-99ae-9a27d5db527c	MTB	Elite	FEMININO	65	8	Fortaleza		2025	2025-03-19 02:19:34.178	2025-03-19 02:19:34.178
1db3b5f4-51b4-4b19-b0d8-3d3ccd16fae7	266d7f1b-b481-4102-8f82-2a6593d19413	MTB	Elite	FEMININO	60	9	Recife		2025	2025-03-19 02:19:34.196	2025-03-19 02:19:34.196
2c220a13-d60c-4340-8dc9-0dd0de79df0f	28a9fa14-334e-4056-9a8f-0a1611d9b631	MTB	Elite	FEMININO	55	10	Manaus		2025	2025-03-19 02:19:34.215	2025-03-19 02:19:34.215
1d0808c9-d86d-46cd-8887-2aa3483ce02d	fcf7027f-c0f7-47bd-8d1d-1525d545d098	MTB	Elite	FEMININO	50	11	Florian├│polis		2025	2025-03-19 02:19:34.235	2025-03-19 02:19:34.235
86fa3707-bea2-4816-b598-45dc4f8e798a	004492b2-41e7-406b-8674-5d619ceb312a	MTB	Elite	FEMININO	45	12	Goi├ónia		2025	2025-03-19 02:19:34.26	2025-03-19 02:19:34.26
133805d4-5e4c-40fc-b29c-5fb77b0fb01b	fc101bfa-42a8-42ba-9580-d0e5c52065fd	MTB	Elite	FEMININO	40	13	Vit├│ria		2025	2025-03-19 02:19:34.288	2025-03-19 02:19:34.288
a28dc21f-9b53-4af4-99f6-871c636c43c2	763c856d-65f8-4075-a9d8-95539f724eda	MTB	Elite	FEMININO	35	14	Natal		2025	2025-03-19 02:19:34.306	2025-03-19 02:19:34.306
5d79f0e7-47f2-4786-9c84-742f1cef6e4d	594b4972-b95c-4961-bd4a-1448d501fce0	MTB	Elite	FEMININO	30	15	Jo├úo Pessoa		2025	2025-03-19 02:19:34.328	2025-03-19 02:19:34.328
\.


--
-- Data for Name: RankingCategory; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."RankingCategory" (id, name, "modalityId", description, active, "createdAt", "updatedAt") FROM stdin;
82af035b-6fbd-44b4-9c36-b558e78811ef	Elite	b951fb5c-0096-4959-a524-f149790972da	\N	t	2025-03-09 03:18:56.754	2025-03-09 03:18:56.752
16aa67ac-400f-4757-a0d8-3648c0c96da5	Elite	890fced7-fdb2-4242-ad94-e7063de67ae8	\N	t	2025-03-09 19:17:38.863	2025-03-09 19:17:38.862
7b55b1b3-116f-41bf-9bcd-4a5ef1d91039	Junior	b951fb5c-0096-4959-a524-f149790972da	\N	t	2025-03-29 14:49:14.715	2025-03-29 14:49:14.714
50eada80-11e4-4f43-bb45-7d5c5cd13e3f	Junior	890fced7-fdb2-4242-ad94-e7063de67ae8	\N	t	2025-03-29 14:59:42.178	2025-03-29 16:57:19.463
\.


--
-- Data for Name: RankingConfiguration; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."RankingConfiguration" (id, name, "modalityId", "categoryId", gender, season, active, "createdAt", "updatedAt") FROM stdin;
a20b40f9-6f53-4ed5-b6f8-8d163ae24494	Ciclismo Elite Masculina 2025	b951fb5c-0096-4959-a524-f149790972da	82af035b-6fbd-44b4-9c36-b558e78811ef	MALE	2025	t	2025-03-09 13:59:27.111	2025-03-09 13:59:27.111
73686f69-fb69-475c-8377-453232718286	Ciclismo Elite Feminino  	b951fb5c-0096-4959-a524-f149790972da	82af035b-6fbd-44b4-9c36-b558e78811ef	FEMALE	2025	t	2025-03-09 14:02:18.677	2025-03-09 14:02:18.677
e3286a5f-b8d0-4181-ac32-842a2fcdb8db	MTB - Elite (Masculino)	890fced7-fdb2-4242-ad94-e7063de67ae8	16aa67ac-400f-4757-a0d8-3648c0c96da5	MALE	2025	t	2025-03-09 21:23:52.118	2025-03-09 21:23:52.118
26c537b1-3b37-4963-991d-7d3e20798033	Ranking FEMININO	890fced7-fdb2-4242-ad94-e7063de67ae8	82af035b-6fbd-44b4-9c36-b558e78811ef	FEMININO	2025	t	2025-03-19 02:03:33.309	2025-03-19 02:03:33.305
083af799-90c2-4c5f-bba9-159a148a569a	MTB - Junior (Masculino)	890fced7-fdb2-4242-ad94-e7063de67ae8	50eada80-11e4-4f43-bb45-7d5c5cd13e3f	MALE	2025	t	2025-03-29 17:34:06.777	2025-03-29 17:34:06.777
\.


--
-- Data for Name: RankingEntry; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."RankingEntry" (id, "configurationId", "athleteId", points, "position", city, team, "createdAt", "updatedAt") FROM stdin;
466cfedf-a560-4250-be15-ab440a0af722	26c537b1-3b37-4963-991d-7d3e20798033	47c65561-a0e3-484c-99ae-9a27d5db527c	130	8	Fortaleza	Cear├í Cycling	2025-03-19 02:03:33.494	2025-03-19 02:19:33.724
4f7846ec-d0c4-42f7-ad64-09ea9908b548	26c537b1-3b37-4963-991d-7d3e20798033	266d7f1b-b481-4102-8f82-2a6593d19413	120	9	Recife	Pernambuco Pedal	2025-03-19 02:03:33.518	2025-03-19 02:19:33.724
f217bf90-3214-43c6-a312-713e081f07d8	26c537b1-3b37-4963-991d-7d3e20798033	28a9fa14-334e-4056-9a8f-0a1611d9b631	110	10	Manaus	Amazon Riders	2025-03-19 02:03:33.537	2025-03-19 02:19:33.724
fd9dcf30-3ce5-48ea-95f9-8bc6a12a35a6	26c537b1-3b37-4963-991d-7d3e20798033	fcf7027f-c0f7-47bd-8d1d-1525d545d098	100	11	Florian├│polis	SC Bikers	2025-03-19 02:03:33.555	2025-03-19 02:19:33.724
abf89d3b-bfae-4b1f-99bd-72f5606c44a7	26c537b1-3b37-4963-991d-7d3e20798033	004492b2-41e7-406b-8674-5d619ceb312a	90	12	Goi├ónia	GO Mountain	2025-03-19 02:03:33.573	2025-03-19 02:19:33.724
40a5c788-7c74-4491-9e61-6747819f6d76	26c537b1-3b37-4963-991d-7d3e20798033	fc101bfa-42a8-42ba-9580-d0e5c52065fd	80	13	Vit├│ria	ES Cycling	2025-03-19 02:03:33.592	2025-03-19 02:19:33.724
a329893e-5fad-423e-b5c4-d5af899ed9a4	26c537b1-3b37-4963-991d-7d3e20798033	763c856d-65f8-4075-a9d8-95539f724eda	70	14	Natal	RN Bikers	2025-03-19 02:03:33.61	2025-03-19 02:19:33.724
344972a3-5147-4813-a56b-db0c0ad2d8e0	26c537b1-3b37-4963-991d-7d3e20798033	594b4972-b95c-4961-bd4a-1448d501fce0	60	15	Jo├úo Pessoa	PB Team	2025-03-19 02:03:33.627	2025-03-19 02:19:33.724
b6438d45-d01d-414f-8d67-bb482036c3a6	26c537b1-3b37-4963-991d-7d3e20798033	e77ebac8-86e7-4b49-beb4-bfc443695b29	200	1	S├úo Paulo	Team Speed	2025-03-19 02:03:33.333	2025-03-19 02:19:33.724
e98593ef-f287-4a36-bb59-34e7ae631ada	26c537b1-3b37-4963-991d-7d3e20798033	19b46922-2b89-4432-b9af-89cdb0fc175c	190	2	Rio de Janeiro	Bike Pro	2025-03-19 02:03:33.38	2025-03-19 02:19:33.724
57fa682a-3ebe-4f83-964d-d7b56b6546e8	26c537b1-3b37-4963-991d-7d3e20798033	f141246f-2cfb-4318-a5fa-0edd83befb4f	180	3	Belo Horizonte	Mountain Girls	2025-03-19 02:03:33.401	2025-03-19 02:19:33.724
1b3d4922-6c6d-473d-af5b-57c0a782927a	26c537b1-3b37-4963-991d-7d3e20798033	94584909-5b5a-4c19-a6b2-f4a1c29465b6	170	4	Curitiba	Pedal Power	2025-03-19 02:03:33.421	2025-03-19 02:19:33.724
e56bfe27-ec37-4d65-a651-e53fe735b8df	26c537b1-3b37-4963-991d-7d3e20798033	9b7a05de-cd9d-48d1-ac24-b15f0b381c93	160	5	Porto Alegre	Bike Team	2025-03-19 02:03:33.438	2025-03-19 02:19:33.724
99f5ffe1-9f0f-42ab-94bd-d09a7c086975	26c537b1-3b37-4963-991d-7d3e20798033	efcf00ec-2275-4cd4-853f-2a2b4cb72043	150	6	Bras├¡lia	Capital Bikers	2025-03-19 02:03:33.457	2025-03-19 02:19:33.724
4aa0202a-0408-491d-8ac6-2aeb36b900ec	26c537b1-3b37-4963-991d-7d3e20798033	2448b5a7-ed67-4845-8bb5-bbc2999eaff4	140	7	Salvador	Bahia Bikes	2025-03-19 02:03:33.48	2025-03-19 02:19:33.724
f1257456-da23-492b-970e-2681f6f145ca	a20b40f9-6f53-4ed5-b6f8-8d163ae24494	cm7kzdd9b0002tiez8io57mt0	390	1	Goiânia	Avulso	2025-03-09 15:38:13.85	2025-03-29 17:32:35.653
5dc25621-e5fa-4fe2-a635-2f3182a4994c	a20b40f9-6f53-4ed5-b6f8-8d163ae24494	cm7kzddeg0005tiezgu7mny7o	320	2			2025-03-09 15:38:13.85	2025-03-29 17:32:35.653
0a188e31-9d56-44c5-87a9-37f62becf963	a20b40f9-6f53-4ed5-b6f8-8d163ae24494	cm7kzddh90008tiezwwcrd3b8	240	3			2025-03-09 15:38:13.85	2025-03-29 17:32:35.653
f310bb63-9bf1-4e14-8155-4d9ddcdfda7c	a20b40f9-6f53-4ed5-b6f8-8d163ae24494	cm7kzddkr000btiezu82356es	200	4			2025-03-09 15:38:13.85	2025-03-29 17:32:35.653
7d4419d4-0a69-4ad5-854c-207e69ba824b	a20b40f9-6f53-4ed5-b6f8-8d163ae24494	cm7kzddnc000etiezr7ux0g1r	180	5			2025-03-09 15:38:13.85	2025-03-29 17:32:35.653
07606c85-ef42-47f1-8fc5-e452b8aad844	a20b40f9-6f53-4ed5-b6f8-8d163ae24494	cm7kzddpq000htiezgjh0rch1	160	6			2025-03-09 15:38:13.85	2025-03-29 17:32:35.653
d229bb4a-4004-47be-b357-2c71fa9872e2	a20b40f9-6f53-4ed5-b6f8-8d163ae24494	cm7kzddrz000ktiezhqyu2moj	140	7			2025-03-09 15:38:13.85	2025-03-29 17:32:35.653
2265b8e2-be32-431c-a285-c65859341f5b	a20b40f9-6f53-4ed5-b6f8-8d163ae24494	cm7kzddx1000qtiezbv0ad3bw	100	9			2025-03-09 15:38:13.85	2025-03-29 17:32:35.653
0c172097-139b-46cb-b9a4-aabe048f220a	a20b40f9-6f53-4ed5-b6f8-8d163ae24494	cm7kzde07000ttiezntdlxq9h	80	10			2025-03-09 15:38:13.85	2025-03-29 17:32:35.653
\.


--
-- Data for Name: RankingModality; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."RankingModality" (id, name, description, active, "createdAt", "updatedAt") FROM stdin;
b951fb5c-0096-4959-a524-f149790972da	Ciclismo de Estrada	\N	t	2025-03-09 03:01:52.535	2025-03-09 03:01:52.365
eecadd77-1965-41f4-9064-d5273002a764	BMX Racing	\N	t	2025-03-19 00:18:12.768	2025-03-29 14:36:23.453
890fced7-fdb2-4242-ad94-e7063de67ae8	MTB	\N	t	2025-03-09 19:17:17.601	2025-03-29 17:35:32.26
\.


--
-- Data for Name: RankingStageResult; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."RankingStageResult" (id, "rankingId", "athleteId", modality, category, gender, "stageName", "position", points, season, date, "createdAt", "modalityId", "categoryId", "entryId") FROM stdin;
5cf6a715-3e5e-499c-a385-cf9bdf1324a2	c4e4cccb-bf76-4bf9-8003-976b50890027	cm7kzdd9b0002tiez8io57mt0	Ciclismo de Estrada	Elite	MALE	Primeira Etapa 	1	100	2025	2025-03-09 00:00:00	2025-03-09 15:38:14.1	\N	\N	\N
fb7fd8f8-7abb-40cc-bc26-ea37014ee4a9	e00e97ea-db67-4b8e-85b3-170004b32432	cm7kzddeg0005tiezgu7mny7o	Ciclismo de Estrada	Elite	MALE	Primeira Etapa 	2	80	2025	2025-03-09 00:00:00	2025-03-09 15:38:14.734	\N	\N	\N
b1208f38-1451-4f84-8080-c2b66af61199	d5b0fa6f-acfd-4ae0-afd7-0087cb73e6db	cm7kzddh90008tiezwwcrd3b8	Ciclismo de Estrada	Elite	MALE	Primeira Etapa 	3	60	2025	2025-03-09 00:00:00	2025-03-09 15:38:14.8	\N	\N	\N
bbe76f70-3d82-4984-937a-0de0c4dbe924	b5e61e51-a4e6-40c1-85a8-22427b0ba707	cm7kzddkr000btiezu82356es	Ciclismo de Estrada	Elite	MALE	Primeira Etapa 	4	50	2025	2025-03-09 00:00:00	2025-03-09 15:38:14.834	\N	\N	\N
bf8d93d8-70ac-4ce6-82de-22258d253cae	a3090ae6-6e76-408d-9f0f-161a5c81fd0d	cm7kzddnc000etiezr7ux0g1r	Ciclismo de Estrada	Elite	MALE	Primeira Etapa 	5	45	2025	2025-03-09 00:00:00	2025-03-09 15:38:14.863	\N	\N	\N
d9b22c6e-3189-47bc-b7a7-2183678a343c	80517238-91c5-4b2f-be77-b982eb1852ca	cm7kzddpq000htiezgjh0rch1	Ciclismo de Estrada	Elite	MALE	Primeira Etapa 	6	40	2025	2025-03-09 00:00:00	2025-03-09 15:38:14.88	\N	\N	\N
d990d182-3b6b-4c78-95cd-1e850404b035	616e2995-b706-4295-b4b5-79afdec19ff7	cm7kzddrz000ktiezhqyu2moj	Ciclismo de Estrada	Elite	MALE	Primeira Etapa 	7	35	2025	2025-03-09 00:00:00	2025-03-09 15:38:14.923	\N	\N	\N
76c1d372-73c6-4ae9-868b-8ad5cbb431aa	80e4ff07-a527-4c2f-83ec-546a40094b21	cm7kzddud000ntiez55lyvek6	Ciclismo de Estrada	Elite	MALE	Primeira Etapa 	8	30	2025	2025-03-09 00:00:00	2025-03-09 15:38:15.007	\N	\N	\N
ae374610-34c8-483d-ac4d-b30930c94b4f	11034b64-dfb6-492e-a9e6-5fcf7ecf4609	cm7kzddx1000qtiezbv0ad3bw	Ciclismo de Estrada	Elite	MALE	Primeira Etapa 	9	25	2025	2025-03-09 00:00:00	2025-03-09 15:38:15.026	\N	\N	\N
3b214a42-5a66-4803-84f7-ae52512eb56a	cce73cb4-1808-448c-bf46-fcb0dee69221	cm7kzde07000ttiezntdlxq9h	Ciclismo de Estrada	Elite	MALE	Primeira Etapa 	10	20	2025	2025-03-09 00:00:00	2025-03-09 15:38:15.046	\N	\N	\N
dafcd06f-6847-4600-b57a-432c34a00be2	c4e4cccb-bf76-4bf9-8003-976b50890027	cm7kzdd9b0002tiez8io57mt0	Ciclismo de Estrada	Elite	MALE	Segunda Etapa 	1	100	2025	2025-03-10 00:00:00	2025-03-09 16:50:21.478	\N	\N	\N
d1fd450f-817d-4c47-a12a-e94bb2b95377	e00e97ea-db67-4b8e-85b3-170004b32432	cm7kzddeg0005tiezgu7mny7o	Ciclismo de Estrada	Elite	MALE	Segunda Etapa 	2	80	2025	2025-03-10 00:00:00	2025-03-09 16:50:21.524	\N	\N	\N
e72b82c6-217e-423e-bb42-f0ea16f6b11c	d5b0fa6f-acfd-4ae0-afd7-0087cb73e6db	cm7kzddh90008tiezwwcrd3b8	Ciclismo de Estrada	Elite	MALE	Segunda Etapa 	3	60	2025	2025-03-10 00:00:00	2025-03-09 16:50:21.545	\N	\N	\N
51b2dd6f-789f-4929-bed2-05e3744f87c0	b5e61e51-a4e6-40c1-85a8-22427b0ba707	cm7kzddkr000btiezu82356es	Ciclismo de Estrada	Elite	MALE	Segunda Etapa 	4	50	2025	2025-03-10 00:00:00	2025-03-09 16:50:21.571	\N	\N	\N
9b3077a3-643f-4ca9-8750-5c79bb6c9733	a3090ae6-6e76-408d-9f0f-161a5c81fd0d	cm7kzddnc000etiezr7ux0g1r	Ciclismo de Estrada	Elite	MALE	Segunda Etapa 	5	45	2025	2025-03-10 00:00:00	2025-03-09 16:50:21.585	\N	\N	\N
3470906f-a04b-41aa-a722-7a33555d3db8	80517238-91c5-4b2f-be77-b982eb1852ca	cm7kzddpq000htiezgjh0rch1	Ciclismo de Estrada	Elite	MALE	Segunda Etapa 	6	40	2025	2025-03-10 00:00:00	2025-03-09 16:50:21.605	\N	\N	\N
fddc2724-8f36-44e0-ba2b-f69a3407665c	616e2995-b706-4295-b4b5-79afdec19ff7	cm7kzddrz000ktiezhqyu2moj	Ciclismo de Estrada	Elite	MALE	Segunda Etapa 	7	35	2025	2025-03-10 00:00:00	2025-03-09 16:50:21.617	\N	\N	\N
4e0f2b07-5da3-4ccb-aebb-114b75da888f	80e4ff07-a527-4c2f-83ec-546a40094b21	cm7kzddud000ntiez55lyvek6	Ciclismo de Estrada	Elite	MALE	Segunda Etapa 	8	30	2025	2025-03-10 00:00:00	2025-03-09 16:50:21.631	\N	\N	\N
29aec9ec-6a2d-4534-abe8-07abf6ffd67f	11034b64-dfb6-492e-a9e6-5fcf7ecf4609	cm7kzddx1000qtiezbv0ad3bw	Ciclismo de Estrada	Elite	MALE	Segunda Etapa 	9	25	2025	2025-03-10 00:00:00	2025-03-09 16:50:21.645	\N	\N	\N
702ef72d-96ab-4391-9b14-e98d9ffa1707	cce73cb4-1808-448c-bf46-fcb0dee69221	cm7kzde07000ttiezntdlxq9h	Ciclismo de Estrada	Elite	MALE	Segunda Etapa 	10	20	2025	2025-03-10 00:00:00	2025-03-09 16:50:21.658	\N	\N	\N
ed31e009-76d3-4558-b402-0aa3e5b7a8e3	c4e4cccb-bf76-4bf9-8003-976b50890027	cm7kzdd9b0002tiez8io57mt0	Ciclismo de Estrada	Elite	MALE	Terceira  Etapa 	1	100	2025	2025-03-09 00:00:00	2025-03-09 21:32:18.247	\N	\N	\N
8a028f06-c7bb-43b5-8735-c8394a50b8f6	e00e97ea-db67-4b8e-85b3-170004b32432	cm7kzddeg0005tiezgu7mny7o	Ciclismo de Estrada	Elite	MALE	Terceira  Etapa 	2	80	2025	2025-03-09 00:00:00	2025-03-09 21:32:18.298	\N	\N	\N
08bc8630-1d3d-4546-988a-d402f5b89d0e	d5b0fa6f-acfd-4ae0-afd7-0087cb73e6db	cm7kzddh90008tiezwwcrd3b8	Ciclismo de Estrada	Elite	MALE	Terceira  Etapa 	3	60	2025	2025-03-09 00:00:00	2025-03-09 21:32:18.313	\N	\N	\N
7dfd3376-e438-4865-b7f7-3c413c75fa8e	b5e61e51-a4e6-40c1-85a8-22427b0ba707	cm7kzddkr000btiezu82356es	Ciclismo de Estrada	Elite	MALE	Terceira  Etapa 	4	50	2025	2025-03-09 00:00:00	2025-03-09 21:32:18.33	\N	\N	\N
4d8254b4-e608-46af-b46d-5f4dc0bcfe6f	a3090ae6-6e76-408d-9f0f-161a5c81fd0d	cm7kzddnc000etiezr7ux0g1r	Ciclismo de Estrada	Elite	MALE	Terceira  Etapa 	5	45	2025	2025-03-09 00:00:00	2025-03-09 21:32:18.343	\N	\N	\N
9bf359e6-612c-434b-9bc0-29518f6bb0de	80517238-91c5-4b2f-be77-b982eb1852ca	cm7kzddpq000htiezgjh0rch1	Ciclismo de Estrada	Elite	MALE	Terceira  Etapa 	6	40	2025	2025-03-09 00:00:00	2025-03-09 21:32:18.355	\N	\N	\N
45e80501-ab64-41f3-a665-397f1c8d1d75	616e2995-b706-4295-b4b5-79afdec19ff7	cm7kzddrz000ktiezhqyu2moj	Ciclismo de Estrada	Elite	MALE	Terceira  Etapa 	7	35	2025	2025-03-09 00:00:00	2025-03-09 21:32:18.366	\N	\N	\N
7af2cf7e-19c2-4636-9133-dcc835cc3f60	80e4ff07-a527-4c2f-83ec-546a40094b21	cm7kzddud000ntiez55lyvek6	Ciclismo de Estrada	Elite	MALE	Terceira  Etapa 	8	30	2025	2025-03-09 00:00:00	2025-03-09 21:32:18.376	\N	\N	\N
b78faf8e-de58-42a5-a3ce-6d2d5428ccc7	11034b64-dfb6-492e-a9e6-5fcf7ecf4609	cm7kzddx1000qtiezbv0ad3bw	Ciclismo de Estrada	Elite	MALE	Terceira  Etapa 	9	25	2025	2025-03-09 00:00:00	2025-03-09 21:32:18.389	\N	\N	\N
6cfa426b-98af-4457-849f-71472bb84392	cce73cb4-1808-448c-bf46-fcb0dee69221	cm7kzde07000ttiezntdlxq9h	Ciclismo de Estrada	Elite	MALE	Terceira  Etapa 	10	20	2025	2025-03-09 00:00:00	2025-03-09 21:32:18.4	\N	\N	\N
47ab17b2-9ee6-4793-97cc-8aeabfdb424a	8eca9554-2fe6-4407-9e75-303c898c7b6c	e77ebac8-86e7-4b49-beb4-bfc443695b29	MTB	Elite	FEMININO	Primeira Etapa 	1	100	2025	2025-03-18 00:00:00	2025-03-19 02:19:33.99	\N	\N	\N
077474e6-9332-466e-89fc-d164dab1a661	27be3871-0e44-4646-98d1-525e2aa71837	19b46922-2b89-4432-b9af-89cdb0fc175c	MTB	Elite	FEMININO	Primeira Etapa 	2	95	2025	2025-03-18 00:00:00	2025-03-19 02:19:34.05	\N	\N	\N
e20a35d8-78b1-49d5-8564-901c03629ffa	0a4b2998-f982-4d0d-966c-9b35cefe6d75	f141246f-2cfb-4318-a5fa-0edd83befb4f	MTB	Elite	FEMININO	Primeira Etapa 	3	90	2025	2025-03-18 00:00:00	2025-03-19 02:19:34.072	\N	\N	\N
6ef27c41-4833-4cf1-91fd-aef1f5aef9e1	c8b08424-fad7-4c17-85e4-0fb32ba3bfae	94584909-5b5a-4c19-a6b2-f4a1c29465b6	MTB	Elite	FEMININO	Primeira Etapa 	4	85	2025	2025-03-18 00:00:00	2025-03-19 02:19:34.095	\N	\N	\N
cc710167-6144-42aa-99e7-6939f3810aa9	f28fe80d-126b-4a7c-ae2c-ef6e0545f4b0	9b7a05de-cd9d-48d1-ac24-b15f0b381c93	MTB	Elite	FEMININO	Primeira Etapa 	5	80	2025	2025-03-18 00:00:00	2025-03-19 02:19:34.113	\N	\N	\N
4873999f-79af-43aa-b82e-7ce0915126eb	32390a83-e0ac-4364-a63e-8588b741a96d	efcf00ec-2275-4cd4-853f-2a2b4cb72043	MTB	Elite	FEMININO	Primeira Etapa 	6	75	2025	2025-03-18 00:00:00	2025-03-19 02:19:34.14	\N	\N	\N
4d7f78c0-4e2f-4a2f-998b-a1acba0ecde0	798e0f38-2843-426b-9013-f1f7df6d1324	2448b5a7-ed67-4845-8bb5-bbc2999eaff4	MTB	Elite	FEMININO	Primeira Etapa 	7	70	2025	2025-03-18 00:00:00	2025-03-19 02:19:34.162	\N	\N	\N
5c868c1b-4fdf-4231-81ec-6aaf70967aec	a103c014-33f1-488e-84c0-503390cbe9a7	47c65561-a0e3-484c-99ae-9a27d5db527c	MTB	Elite	FEMININO	Primeira Etapa 	8	65	2025	2025-03-18 00:00:00	2025-03-19 02:19:34.181	\N	\N	\N
4c37fd5f-0190-42a4-ad0b-a338bfa5644e	1db3b5f4-51b4-4b19-b0d8-3d3ccd16fae7	266d7f1b-b481-4102-8f82-2a6593d19413	MTB	Elite	FEMININO	Primeira Etapa 	9	60	2025	2025-03-18 00:00:00	2025-03-19 02:19:34.2	\N	\N	\N
a0644858-23d9-419d-82ad-9529099d216b	2c220a13-d60c-4340-8dc9-0dd0de79df0f	28a9fa14-334e-4056-9a8f-0a1611d9b631	MTB	Elite	FEMININO	Primeira Etapa 	10	55	2025	2025-03-18 00:00:00	2025-03-19 02:19:34.221	\N	\N	\N
80096340-da51-4a60-9d3e-6412d97e9c5f	1d0808c9-d86d-46cd-8887-2aa3483ce02d	fcf7027f-c0f7-47bd-8d1d-1525d545d098	MTB	Elite	FEMININO	Primeira Etapa 	11	50	2025	2025-03-18 00:00:00	2025-03-19 02:19:34.239	\N	\N	\N
849ce3d0-2aac-4606-a7b1-c707d851b529	86fa3707-bea2-4816-b598-45dc4f8e798a	004492b2-41e7-406b-8674-5d619ceb312a	MTB	Elite	FEMININO	Primeira Etapa 	12	45	2025	2025-03-18 00:00:00	2025-03-19 02:19:34.266	\N	\N	\N
d4e08aec-be5d-4eff-9b46-2e4169746075	133805d4-5e4c-40fc-b29c-5fb77b0fb01b	fc101bfa-42a8-42ba-9580-d0e5c52065fd	MTB	Elite	FEMININO	Primeira Etapa 	13	40	2025	2025-03-18 00:00:00	2025-03-19 02:19:34.291	\N	\N	\N
11f8034b-e0cf-4963-b45e-3a6a4b9b9bb4	a28dc21f-9b53-4af4-99f6-871c636c43c2	763c856d-65f8-4075-a9d8-95539f724eda	MTB	Elite	FEMININO	Primeira Etapa 	14	35	2025	2025-03-18 00:00:00	2025-03-19 02:19:34.309	\N	\N	\N
ed846090-730c-48da-9c36-59554b54b71d	5d79f0e7-47f2-4786-9c84-742f1cef6e4d	594b4972-b95c-4961-bd4a-1448d501fce0	MTB	Elite	FEMININO	Primeira Etapa 	15	30	2025	2025-03-18 00:00:00	2025-03-19 02:19:34.331	\N	\N	\N
724afadf-ccd1-4805-9da4-c9b5e3d25e36	c4e4cccb-bf76-4bf9-8003-976b50890027	cm7kzdd9b0002tiez8io57mt0	Ciclismo de Estrada	Elite	MALE	3 Etapa	1	100	2025	2025-03-29 00:00:00	2025-03-29 17:32:35.68	\N	\N	\N
13556716-aa43-4581-962f-6146abbb67bf	e00e97ea-db67-4b8e-85b3-170004b32432	cm7kzddeg0005tiezgu7mny7o	Ciclismo de Estrada	Elite	MALE	3 Etapa	2	80	2025	2025-03-29 00:00:00	2025-03-29 17:32:35.695	\N	\N	\N
dbcd45fa-e0b5-467c-bef2-5ab16836c6f5	d5b0fa6f-acfd-4ae0-afd7-0087cb73e6db	cm7kzddh90008tiezwwcrd3b8	Ciclismo de Estrada	Elite	MALE	3 Etapa	3	60	2025	2025-03-29 00:00:00	2025-03-29 17:32:35.706	\N	\N	\N
5e1514f3-27f8-416f-8302-819d890f220e	b5e61e51-a4e6-40c1-85a8-22427b0ba707	cm7kzddkr000btiezu82356es	Ciclismo de Estrada	Elite	MALE	3 Etapa	4	50	2025	2025-03-29 00:00:00	2025-03-29 17:32:35.718	\N	\N	\N
0d830a80-f4d7-4e65-a726-757fc9d4b4c0	a3090ae6-6e76-408d-9f0f-161a5c81fd0d	cm7kzddnc000etiezr7ux0g1r	Ciclismo de Estrada	Elite	MALE	3 Etapa	5	45	2025	2025-03-29 00:00:00	2025-03-29 17:32:35.728	\N	\N	\N
9aa06d9f-b689-44c3-8484-fd5e1e10b62d	80517238-91c5-4b2f-be77-b982eb1852ca	cm7kzddpq000htiezgjh0rch1	Ciclismo de Estrada	Elite	MALE	3 Etapa	6	40	2025	2025-03-29 00:00:00	2025-03-29 17:32:35.739	\N	\N	\N
b90364d6-1ab1-44ac-a2bd-4120930489d7	616e2995-b706-4295-b4b5-79afdec19ff7	cm7kzddrz000ktiezhqyu2moj	Ciclismo de Estrada	Elite	MALE	3 Etapa	7	35	2025	2025-03-29 00:00:00	2025-03-29 17:32:35.75	\N	\N	\N
359a44fc-4393-46c7-af6a-a78dd2a49ecd	80e4ff07-a527-4c2f-83ec-546a40094b21	cm7kzddud000ntiez55lyvek6	Ciclismo de Estrada	Elite	MALE	3 Etapa	8	30	2025	2025-03-29 00:00:00	2025-03-29 17:32:35.761	\N	\N	\N
4624fd1a-6853-44ab-ba95-14e447faaf43	11034b64-dfb6-492e-a9e6-5fcf7ecf4609	cm7kzddx1000qtiezbv0ad3bw	Ciclismo de Estrada	Elite	MALE	3 Etapa	9	25	2025	2025-03-29 00:00:00	2025-03-29 17:32:35.773	\N	\N	\N
43fde61b-eba2-4b78-9c86-53af52fd0135	cce73cb4-1808-448c-bf46-fcb0dee69221	cm7kzde07000ttiezntdlxq9h	Ciclismo de Estrada	Elite	MALE	3 Etapa	10	20	2025	2025-03-29 00:00:00	2025-03-29 17:32:35.782	\N	\N	\N
\.


--
-- Data for Name: Registration; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Registration" (id, "eventId", name, email, phone, status, "createdAt", "updatedAt", "userId", cpf, protocol, birthdate, modalityid, categoryid, genderid, tierid, addressdata, "couponId", "discountAmount") FROM stdin;
7eb48ace-881b-452d-9080-c9cc7d7dcd8d	a8f6cfb3-9fc8-4f04-89f9-63bd217c8e34	Weberty Gerolineto	betofoto1@gmail.com	(62) 99424-2329	CONFIRMADA	2025-04-01 17:20:05.704	2025-04-01 17:20:05.704	457741f4-177b-471a-ae2c-c8320411e33b	946.478.101-78	20250401-59635	1977-04-11 00:00:00	cm7roc93s0002kja8p293o507	cm7roxtzq0011kja8s7xxmq2n	b4f82f14-79d6-4123-a29b-4d45ff890a52	\N	{"cep":"74360290","street":"Rua Coelho Neto","number":"14","complement":"Qd. 10 Lt. 23","neighborhood":"Jardim Vila Boa","city":"Goiânia","state":"GO"}	\N	\N
bd302554-13b2-480b-9648-315788a44a96	a8f6cfb3-9fc8-4f04-89f9-63bd217c8e34	Weberty Gerolineto	betofoto1@gmail.com	(62) 99424-2329	CONFIRMADA	2025-04-01 22:08:22.969	2025-04-01 22:08:22.969	457741f4-177b-471a-ae2c-c8320411e33b	946.478.101-78	20250401-28188	1977-04-11 00:00:00	cm7roc93s0002kja8p293o507	cm7rp18tl001rkja89pu01awm	b4f82f14-79d6-4123-a29b-4d45ff890a52	\N	{"cep":"74360290","street":"Rua Coelho Neto","number":"14","complement":"Qd. 10 Lt. 23","neighborhood":"Jardim Vila Boa","city":"Goiânia","state":"GO"}	\N	\N
9fac55de-cc08-4a51-b903-0a76c970381f	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 1	atleta1@teste.com	(64) 96604-8351	CONFIRMED	2025-04-10 18:48:44.591	2025-04-10 18:48:44.589	cm7kzdd4g0000tiez3a9g0lok	973.466.720-30	PROT-1525	1981-04-19 03:00:00	\N	3524e809-1524-4219-81dd-5a6459aa1894	\N	\N	\N	\N	\N
9d2e9a6d-fa51-43e3-b011-f8ceecbfc3ad	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 2	atleta2@teste.com	(74) 98432-1876	CONFIRMED	2025-04-10 18:48:44.599	2025-04-10 18:48:44.598	cm7kzdded0003tiezwi59ygcp	723.544.901-90	PROT-1269	1997-01-25 02:00:00	\N	4e681273-544f-46ef-8105-9c33c3fac95e	\N	\N	\N	\N	\N
606318e8-1376-472b-8275-c4a33ae6a5a4	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 3	atleta3@teste.com	(42) 97875-1956	CONFIRMED	2025-04-10 18:48:44.603	2025-04-10 18:48:44.602	cm7kzddh50006tiezk9ih5dih	209.664.873-70	PROT-7655	1989-12-19 02:00:00	\N	8ee4e740-3226-4608-8611-0932066baee1	\N	\N	\N	\N	\N
7c0f72f4-2547-4736-9de7-aa52fbe5cb2c	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 4	atleta4@teste.com	(15) 94467-8551	CONFIRMED	2025-04-10 18:48:44.607	2025-04-10 18:48:44.606	cm7kzddkh0009tiez291ptfqk	287.332.831-73	PROT-5122	1983-11-26 03:00:00	\N	3524e809-1524-4219-81dd-5a6459aa1894	\N	\N	\N	\N	\N
f5a7d713-371b-4d3d-a333-e3a9073ba33f	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 5	atleta5@teste.com	(31) 92919-3505	CONFIRMED	2025-04-10 18:48:44.61	2025-04-10 18:48:44.609	cm7kzddn9000ctiezutxosfej	350.188.414-97	PROT-4790	1986-09-04 03:00:00	\N	4e681273-544f-46ef-8105-9c33c3fac95e	\N	\N	\N	\N	\N
9ead5033-804e-4d75-a6ee-5cd5d1912be0	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 6	atleta6@teste.com	(40) 94356-8123	CONFIRMED	2025-04-10 18:48:44.614	2025-04-10 18:48:44.613	cm7kzddpo000ftieziz8div3v	514.325.468-87	PROT-1365	1989-04-04 03:00:00	\N	8ee4e740-3226-4608-8611-0932066baee1	\N	\N	\N	\N	\N
d9171d8d-46e7-4674-b94a-e4640a7ac4e5	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 7	atleta7@teste.com	(98) 91098-4640	CONFIRMED	2025-04-10 18:48:44.619	2025-04-10 18:48:44.618	cm7kzddrx000itiez2k6x3hso	127.906.234-57	PROT-9502	1989-11-01 02:00:00	\N	3524e809-1524-4219-81dd-5a6459aa1894	\N	\N	\N	\N	\N
28c29f0e-81ad-48ca-835b-52cc00c9ba54	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 8	atleta8@teste.com	(68) 91726-8384	CONFIRMED	2025-04-10 18:48:44.623	2025-04-10 18:48:44.622	cm7kzddu9000ltiez6d3gg30f	202.716.597-49	PROT-4606	1989-06-12 03:00:00	\N	4e681273-544f-46ef-8105-9c33c3fac95e	\N	\N	\N	\N	\N
1fbd6b84-5d92-46bd-9387-e477bbc0e02c	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 9	atleta9@teste.com	(33) 92336-2388	CONFIRMED	2025-04-10 18:48:44.627	2025-04-10 18:48:44.627	cm7kzddww000otiezjec8og4h	541.278.592-26	PROT-9544	1982-02-11 03:00:00	\N	8ee4e740-3226-4608-8611-0932066baee1	\N	\N	\N	\N	\N
3ff8f81e-0950-4664-9957-ffbdd8b1c3fb	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 10	atleta10@teste.com	(38) 91081-3170	CONFIRMED	2025-04-10 18:48:44.631	2025-04-10 18:48:44.63	cm7kzde04000rtiezgpt9xa7a	135.840.313-83	PROT-6742	1992-08-18 03:00:00	\N	3524e809-1524-4219-81dd-5a6459aa1894	\N	\N	\N	\N	\N
bf5f5559-bf27-4ee0-8088-c357196a4d3e	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 11	atleta11@teste.com	(50) 93554-8561	CONFIRMED	2025-04-10 18:48:44.635	2025-04-10 18:48:44.634	cm7kzde3e000utiez3m8ucd0v	927.654.721-81	PROT-6075	1987-01-25 02:00:00	\N	4e681273-544f-46ef-8105-9c33c3fac95e	\N	\N	\N	\N	\N
21d40c4c-3093-4fc6-94bb-6133855d9436	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 12	atleta12@teste.com	(58) 95971-5219	CONFIRMED	2025-04-10 18:48:44.64	2025-04-10 18:48:44.639	cm7kzde6c000xtiez52ui6q5w	244.461.911-91	PROT-223	1992-12-18 02:00:00	\N	8ee4e740-3226-4608-8611-0932066baee1	\N	\N	\N	\N	\N
482c782e-868f-4263-a8c0-e42066d04a25	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 13	atleta13@teste.com	(13) 98380-4690	CONFIRMED	2025-04-10 18:48:44.644	2025-04-10 18:48:44.643	cm7kzde9q0010tiez3cgegpfh	123.973.850-79	PROT-508	1982-12-06 03:00:00	\N	3524e809-1524-4219-81dd-5a6459aa1894	\N	\N	\N	\N	\N
42529bc3-499a-4f8f-a3eb-e3e95d3410ef	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 14	atleta14@teste.com	(39) 92744-3689	CONFIRMED	2025-04-10 18:48:44.649	2025-04-10 18:48:44.648	cm7kzdecr0013tiezxe8m3l5f	713.340.480-17	PROT-4953	1995-11-01 02:00:00	\N	4e681273-544f-46ef-8105-9c33c3fac95e	\N	\N	\N	\N	\N
634057b0-581d-4164-9b9e-30ae9827d2ae	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 15	atleta15@teste.com	(64) 99115-5104	CONFIRMED	2025-04-10 18:48:44.652	2025-04-10 18:48:44.651	cm7kzdefw0016tiezlenz7pl0	732.528.841-44	PROT-8831	1991-12-23 02:00:00	\N	8ee4e740-3226-4608-8611-0932066baee1	\N	\N	\N	\N	\N
78d3f4b5-0779-46ed-ad4f-6aee057d7655	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 16	atleta16@teste.com	(73) 99604-4718	CONFIRMED	2025-04-10 18:48:44.655	2025-04-10 18:48:44.654	cm7kzdeio0019tiezxh9s6g2x	523.663.176-80	PROT-9864	1987-02-02 02:00:00	\N	3524e809-1524-4219-81dd-5a6459aa1894	\N	\N	\N	\N	\N
3d51f89c-f015-4492-a653-e532b2ba582e	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 17	atleta17@teste.com	(71) 94738-5259	CONFIRMED	2025-04-10 18:48:44.66	2025-04-10 18:48:44.659	cm7kzdelz001ctiezaqcqc4pp	779.579.483-77	PROT-2080	1983-03-12 03:00:00	\N	4e681273-544f-46ef-8105-9c33c3fac95e	\N	\N	\N	\N	\N
77d0aa64-b680-4b94-af2f-e69042d1c679	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 18	atleta18@teste.com	(16) 93633-4992	CONFIRMED	2025-04-10 18:48:44.664	2025-04-10 18:48:44.663	cm7kzdeoa001ftiezyc8m6xw9	242.127.894-28	PROT-7408	1986-02-27 02:00:00	\N	8ee4e740-3226-4608-8611-0932066baee1	\N	\N	\N	\N	\N
92334336-4220-4fa7-836e-f4398072ff79	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 19	atleta19@teste.com	(55) 91258-9072	CONFIRMED	2025-04-10 18:48:44.667	2025-04-10 18:48:44.666	cm7kzdeqp001itiezoorxgzqq	895.304.186-56	PROT-7214	1994-10-11 03:00:00	\N	3524e809-1524-4219-81dd-5a6459aa1894	\N	\N	\N	\N	\N
7c0ee245-a67c-43cf-87ac-93c09ef644d3	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 20	atleta20@teste.com	(11) 91303-7059	CONFIRMED	2025-04-10 18:48:44.67	2025-04-10 18:48:44.669	cm7kzdet3001ltiezta96wsqi	279.694.916-48	PROT-6854	1980-07-17 03:00:00	\N	4e681273-544f-46ef-8105-9c33c3fac95e	\N	\N	\N	\N	\N
ec58ae4a-94a7-4b88-9f6b-272a9c3817bf	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 21	atleta21@teste.com	(26) 92060-7209	CONFIRMED	2025-04-10 18:48:44.674	2025-04-10 18:48:44.673	cm7kzdevd001otiez58r2ylk8	329.915.164-61	PROT-827	1996-05-27 03:00:00	\N	8ee4e740-3226-4608-8611-0932066baee1	\N	\N	\N	\N	\N
091d7321-8c6a-42fd-a525-8de8101ce669	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 22	atleta22@teste.com	(12) 93979-7449	CONFIRMED	2025-04-10 18:48:44.678	2025-04-10 18:48:44.677	cm7kzdexq001rtiezprxxna5g	346.503.859-66	PROT-288	1989-03-25 03:00:00	\N	3524e809-1524-4219-81dd-5a6459aa1894	\N	\N	\N	\N	\N
0bc08fc6-50b1-4a8a-9999-49116cc4f9d2	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 23	atleta23@teste.com	(35) 94661-2459	CONFIRMED	2025-04-10 18:48:44.681	2025-04-10 18:48:44.68	cm7kzdf0f001utiezxygpymrl	408.360.942-26	PROT-6812	1985-04-08 03:00:00	\N	4e681273-544f-46ef-8105-9c33c3fac95e	\N	\N	\N	\N	\N
d31af3b9-441b-4548-acbd-bdb710f0ec00	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 24	atleta24@teste.com	(78) 95384-4834	CONFIRMED	2025-04-10 18:48:44.685	2025-04-10 18:48:44.684	cm7kzdf2l001xtiezqu3mia26	157.531.629-60	PROT-1855	1995-06-14 03:00:00	\N	8ee4e740-3226-4608-8611-0932066baee1	\N	\N	\N	\N	\N
ceb8bdbd-d96c-4215-b18e-1b5a21290bf5	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 25	atleta25@teste.com	(42) 91811-2192	CONFIRMED	2025-04-10 18:48:44.687	2025-04-10 18:48:44.686	cm7kzdf4y0020tiez5y3u67yw	681.483.246-18	PROT-287	1988-12-08 02:00:00	\N	3524e809-1524-4219-81dd-5a6459aa1894	\N	\N	\N	\N	\N
7d87cebe-00c2-4c81-a1e8-bba30a66dffa	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 26	atleta26@teste.com	(98) 99309-9599	CONFIRMED	2025-04-10 18:48:44.691	2025-04-10 18:48:44.69	cm7kzdf7g0023tiez0jprhb07	359.923.645-67	PROT-4824	1984-03-18 03:00:00	\N	4e681273-544f-46ef-8105-9c33c3fac95e	\N	\N	\N	\N	\N
66b9aafa-1552-4d8a-8d4f-bdb45cc9952d	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 27	atleta27@teste.com	(69) 96796-3056	CONFIRMED	2025-04-10 18:48:44.695	2025-04-10 18:48:44.694	cm7kzdf9q0026tiezxd4bpatf	934.134.782-35	PROT-547	1984-12-28 03:00:00	\N	8ee4e740-3226-4608-8611-0932066baee1	\N	\N	\N	\N	\N
54a873d8-0b18-4b78-abf3-cec18232a719	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 28	atleta28@teste.com	(81) 91063-6858	CONFIRMED	2025-04-10 18:48:44.699	2025-04-10 18:48:44.698	cm7kzdfbp0029tiezaeeegzmp	759.931.224-62	PROT-7329	1986-12-13 02:00:00	\N	3524e809-1524-4219-81dd-5a6459aa1894	\N	\N	\N	\N	\N
e93b512b-6002-464c-9b18-d0f390f01d47	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 29	atleta29@teste.com	(24) 94371-1153	CONFIRMED	2025-04-10 18:48:44.702	2025-04-10 18:48:44.701	cm7kzdfdr002ctiezk8vgk50i	992.685.525-64	PROT-2244	1993-10-20 02:00:00	\N	4e681273-544f-46ef-8105-9c33c3fac95e	\N	\N	\N	\N	\N
1bb91208-cf19-4fbc-aace-b4f31d8e7156	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Atleta Teste 30	atleta30@teste.com	(63) 91143-6389	CONFIRMED	2025-04-10 18:48:44.705	2025-04-10 18:48:44.704	cm7kzdffr002ftiezj793qg3z	181.857.978-96	PROT-7145	1995-03-04 03:00:00	\N	8ee4e740-3226-4608-8611-0932066baee1	\N	\N	\N	\N	\N
0d209e96-751b-4299-b9d7-4d33c0d6dcdd	6bc32f74-3a69-4aa8-a0d0-b885f2741378	Weberty Gerolineto	w.betofoto@gmail.com	(62) 99424-2329	PENDING_PAYMENT	2025-04-12 22:54:57.76	2025-04-12 22:54:57.76	8d7cdfed-4751-4d1a-9d2b-ca2726835e62	946.478.101-78	REG-2017	1977-04-11 00:00:00	cm7ro2ao80001kja8o4jdj323	3524e809-1524-4219-81dd-5a6459aa1894	b4f82f14-79d6-4123-a29b-4d45ff890a52	52d2bc9e-500b-40e1-a915-c13b6f78fd74	{"cep":"74360290","street":"Rua Coelho Neto","number":"14","complement":"Qd. 10 Lt. 23","neighborhood":"Jardim Vila Boa","city":"Goiânia","state":"GO"}	\N	\N
3476bffb-133d-4ef5-947a-597dbdb8886d	430a1b6e-a874-43a4-94f5-f9140d41e899	Weberty Gerolineto	w.betofoto@hotmail.com	(62) 99424-2329	PENDING_PAYMENT	2025-04-14 23:43:10.175	2025-04-14 23:43:10.175	0ae569d4-e20f-4a44-bde3-ef29b05e112f	946.478.101-78	REG-8702	1977-04-11 00:00:00	cm7ro2ao80001kja8o4jdj323	8ee4e740-3226-4608-8611-0932066baee1	b4f82f14-79d6-4123-a29b-4d45ff890a52	0edf2c57-ca41-4a24-ada7-aeef0c68aa84	{"cep":"74360290","street":"Rua Coelho Neto","number":"14","complement":"Qd. 10 Lt. 23","neighborhood":"Jardim Vila Boa","city":"Goiânia","state":"GO"}	430a1b6e-a874-43a4-94f5-f9140d41e899-PROMOSUB30	10.00
52c9b28e-4b0c-490b-bccb-a845382b8c24	430a1b6e-a874-43a4-94f5-f9140d41e899	Weberty Gerolineto	w.betofoto@hotmail.com	(62) 99424-2329	PENDING_PAYMENT	2025-04-16 23:50:26.72	2025-04-16 23:50:26.72	0ae569d4-e20f-4a44-bde3-ef29b05e112f	946.478.101-78	REG-2875	1977-04-11 00:00:00	cm7ro2ao80001kja8o4jdj323	4e681273-544f-46ef-8105-9c33c3fac95e	b4f82f14-79d6-4123-a29b-4d45ff890a52	0edf2c57-ca41-4a24-ada7-aeef0c68aa84	{"cep":"74360290","street":"Rua Coelho Neto","number":"14","complement":"Qd. 10 Lt. 23","neighborhood":"Jardim Vila Boa","city":"Goiânia","state":"GO"}	\N	\N
c820ade8-2692-4375-bab5-1292017a86e9	430a1b6e-a874-43a4-94f5-f9140d41e899	Weberty Gerolineto	w.betofoto@hotmail.com	(62) 99424-2329	PENDING_PAYMENT	2025-04-17 13:38:13.625	2025-04-17 13:38:13.625	0ae569d4-e20f-4a44-bde3-ef29b05e112f	946.478.101-78	REG-0841	1977-04-11 00:00:00	cm7ro2ao80001kja8o4jdj323	cm7roxtzq0011kja8s7xxmq2n	b4f82f14-79d6-4123-a29b-4d45ff890a52	0edf2c57-ca41-4a24-ada7-aeef0c68aa84	{"cep":"74360290","street":"Rua Coelho Neto","number":"14","complement":"Qd. 10 Lt. 23","neighborhood":"Jardim Vila Boa","city":"Goiânia","state":"GO"}	\N	\N
40ea0c4a-1a6e-4c53-8cd3-d9d0e5ca74e8	430a1b6e-a874-43a4-94f5-f9140d41e899	Weberty Gerolineto	betofoto1@gmail.com	(62) 99424-2329	EXPIRED	2025-04-15 00:23:48.652	2025-04-15 00:23:48.652	457741f4-177b-471a-ae2c-c8320411e33b	946.478.101-78	REG-7658	1977-04-11 00:00:00	cm7ro2ao80001kja8o4jdj323	8ee4e740-3226-4608-8611-0932066baee1	b4f82f14-79d6-4123-a29b-4d45ff890a52	0edf2c57-ca41-4a24-ada7-aeef0c68aa84	{"cep":"74360290","street":"Rua Coelho Neto","number":"14","complement":"Qd. 10 Lt. 23","neighborhood":"Jardim Vila Boa","city":"Goiânia","state":"GO"}	430a1b6e-a874-43a4-94f5-f9140d41e899-PROMOSUB30	10.00
c28a8fd0-8cb9-4caa-a9f7-0061a546d191	430a1b6e-a874-43a4-94f5-f9140d41e899	Weberty Carlos Chaves Gerolineto	betofoto1@gmail.com	(62) 99424-2329	PENDING_PAYMENT	2025-04-19 19:12:21.953	2025-04-19 19:12:21.953	457741f4-177b-471a-ae2c-c8320411e33b	136.651.541-20	REG-7136	1977-04-11 00:00:00	cm7ro2ao80001kja8o4jdj323	8ee4e740-3226-4608-8611-0932066baee1	b4f82f14-79d6-4123-a29b-4d45ff890a52	0edf2c57-ca41-4a24-ada7-aeef0c68aa84	{"cep":"74363750","street":"Rua D 34","number":"34","complement":"","neighborhood":"Setor Novo Horizonte","city":"Goiânia","state":"GO"}	\N	\N
ef8374bf-cbbe-4dd9-add8-c92324a552d1	d8b98cd4-16f5-4845-b344-d413dfe5f2db	Weberty Gerolineto	betofoto1@gmail.com	\N	PENDING	2025-05-21 13:12:20.647	2025-05-21 13:12:20.647	457741f4-177b-471a-ae2c-c8320411e33b	\N	EVE-maxyq2lj-C7JR5	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: SmallBanner; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."SmallBanner" (id, title, image, link, "position", active, "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
\.


--
-- Data for Name: Sponsor; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."Sponsor" (id, name, logo, link, "order", active, "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
d3e357cc-d860-4b08-a45b-c79ede8f9f38	Prefeitura de Goiania	patrocinadores/Prefeitura H.png	https://www.goiania.go.gov.br	2	t	2025-04-16 13:36:28.457	2025-04-16 13:36:28.457	\N	\N
eae76a87-1c0d-4265-9931-6a9958eafc11	gatorade	patrocinadores/Gatorade 2.png	https://www.gatorade.com.br/	3	t	2025-04-16 13:37:58.25	2025-04-16 13:37:58.25	\N	\N
6868175b-7063-47b8-9580-c9b4b2e49c67	skybke	patrocinadores/Sky Bike.png	https://www.skybike.com.br	4	t	2025-04-16 13:39:48.457	2025-04-16 13:39:48.457	\N	\N
dbeb9f8b-9748-4d6e-9603-7d061ee6216c	Sonic	patrocinadores/Sonic.png	\N	1	t	2025-05-14 10:41:08.816	2025-05-14 10:41:08.816	\N	\N
\.


--
-- Data for Name: State; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."State" (id, name, code, "countryId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TempRegistration; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."TempRegistration" (id, "eventId", name, email, document, phone, "birthDate", "modalityId", "categoryId", "genderId", "tierId", "addressData", "createdAt", "expiresAt", cpf, birthdate, modalityid, categoryid, genderid, tierid, addressdata) FROM stdin;
6e36212d-0615-4057-88c4-55989f1c3c4f	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Weberty Gerolineto	w.betofoto@hotmail.com	946.478.101-78	62994242329	1977-04-11 00:00:00	cm7ro2ao80001kja8o4jdj323	cm7rosfmk0009kja876mny3kr	b4f82f14-79d6-4123-a29b-4d45ff890a52	free	{"cep":"74363750","street":"Rua D 34","number":"14","complement":"Qd. 76 Lt 14","neighborhood":"Setor Novo Horizonte","city":"Goi├ónia","state":"GO"}	2025-03-21 13:22:51.451	2025-03-21 15:22:51.451	\N	\N	\N	\N	\N	\N	\N
add4b768-c5ce-4e5c-98ee-91015eb047dc	3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6	Weberty Gerolineto	w.betofoto@hotmail.com	946.478.101-78	62994242329	1977-04-11 00:00:00	cm7ro2ao80001kja8o4jdj323	cm7rosfmk0009kja876mny3kr	b4f82f14-79d6-4123-a29b-4d45ff890a52	free	{"cep":"74363750","street":"Rua D 34","number":"14","complement":"Qd. 76 Lt 14","neighborhood":"Setor Novo Horizonte","city":"Goi├ónia","state":"GO"}	2025-03-21 19:44:57.595	2025-03-21 21:44:57.595	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."User" (id, name, email, "emailVerified", image, password, role, "isManager", "managedClubId", phone) FROM stdin;
cm7kzddkh0009tiez291ptfqk	Atleta Teste 4	atleta4@teste.com	\N	\N	$2b$10$rkdRYRCD3DwgJ3Z0r8Y/T.ugv/MEDafjMChFm5Vm2vxM.yUAVJaSy	USER	f	\N	\N
cm7kzddn9000ctiezutxosfej	Atleta Teste 5	atleta5@teste.com	\N	\N	$2b$10$gW0Rk6UUGoG.ByZFMiX88.0UIETd7dp.r54AG3Cu0TY0LRsHar/o6	USER	f	\N	\N
cm7kzddpo000ftieziz8div3v	Atleta Teste 6	atleta6@teste.com	\N	\N	$2b$10$4waFrtllZ9SLqd8KP3WFkenJLJamw7ITxyWTmwdv91ZPEdrOtmr9u	USER	f	\N	\N
cm7kzddrx000itiez2k6x3hso	Atleta Teste 7	atleta7@teste.com	\N	\N	$2b$10$JDrwHcXiQ5ZKnI6YpyFQC.8J2HxxxVNZ6hPisCodGPwI8tnufkp2e	USER	f	\N	\N
cm7kzddu9000ltiez6d3gg30f	Atleta Teste 8	atleta8@teste.com	\N	\N	$2b$10$wngw8atVyae945MkcnnYlur5sBEMEarQncydont/ZVQWPknFTsEcG	USER	f	\N	\N
cm7kzddww000otiezjec8og4h	Atleta Teste 9	atleta9@teste.com	\N	\N	$2b$10$j49ltWa5bqdVvEboynsLOecdvFBCDAn8.QOeRUl7lKo6GGLvGLR3m	USER	f	\N	\N
cm7kzde04000rtiezgpt9xa7a	Atleta Teste 10	atleta10@teste.com	\N	\N	$2b$10$xWbyCmwa2UNtPuNpbK9/1OVXdfLD6bRqrq2D7H3laozEZmsfrTJby	USER	f	\N	\N
cm7kzde3e000utiez3m8ucd0v	Atleta Teste 11	atleta11@teste.com	\N	\N	$2b$10$vHGWQUIoikU3XkzWrsRp9eFsolYW4LSSV7qGyCwfzXyfRmAdf5eMG	USER	f	\N	\N
cm7kzde6c000xtiez52ui6q5w	Atleta Teste 12	atleta12@teste.com	\N	\N	$2b$10$oq/TVxNUpkZTHEO4xPWk3.2FS.kCvm9aB8KovdRLL7kJqAqWJEQbq	USER	f	\N	\N
cm7kzde9q0010tiez3cgegpfh	Atleta Teste 13	atleta13@teste.com	\N	\N	$2b$10$80OaI/ud2Et12bdCJNVfQOlz3ECLv4qAn3Ho2yECPgI9NlEPANiHW	USER	f	\N	\N
cm7kzdecr0013tiezxe8m3l5f	Atleta Teste 14	atleta14@teste.com	\N	\N	$2b$10$Fgdf8Cl0QBvvQlEQ89KkHuIHxET5KnCZXbtkO1Z8.oU.4j/p9APc2	USER	f	\N	\N
cm7kzdefw0016tiezlenz7pl0	Atleta Teste 15	atleta15@teste.com	\N	\N	$2b$10$gwCjQXHfFMin9Uu3Fbp03Oh8Bl9yaRw0odTALNsIpsc782EETIVbi	USER	f	\N	\N
cm7kzdeio0019tiezxh9s6g2x	Atleta Teste 16	atleta16@teste.com	\N	\N	$2b$10$fv0kngznNDiS3hEG1h/One04k6Hdj8WtHMqtBU7nT.VEE01IsBcxq	USER	f	\N	\N
cm7kzdelz001ctiezaqcqc4pp	Atleta Teste 17	atleta17@teste.com	\N	\N	$2b$10$LDpapcCytc/F/16ojYzLgO2WhCxkInlRvmPwb9R6/Ujn6VaBF1w9C	USER	f	\N	\N
cm7kzdeoa001ftiezyc8m6xw9	Atleta Teste 18	atleta18@teste.com	\N	\N	$2b$10$v2jjnV0NLdbbXWojyVKWZ.xuTyYtJTOrlYZVS23xQHAghpAxTULaS	USER	f	\N	\N
cm7kzdeqp001itiezoorxgzqq	Atleta Teste 19	atleta19@teste.com	\N	\N	$2b$10$gMTTvFgY0KCIiOjvJopJLu8GiU97wtGZ5o6ElYQJXnl6aBtnwDRHu	USER	f	\N	\N
cm7kzdet3001ltiezta96wsqi	Atleta Teste 20	atleta20@teste.com	\N	\N	$2b$10$I4ENab0kXMalCS8ZBESp.OOeUGcXxoivhyMSo6Bo8LobVHpFsPrIK	USER	f	\N	\N
cm7kzdevd001otiez58r2ylk8	Atleta Teste 21	atleta21@teste.com	\N	\N	$2b$10$GpDi/S4yru80um0NPyDfeeHosiw5YxeZ4vMV3tev.A0yRfrVjRjkS	USER	f	\N	\N
cm7kzdexq001rtiezprxxna5g	Atleta Teste 22	atleta22@teste.com	\N	\N	$2b$10$q65pwkpvYLi8dgptd7KV8.GWIr1oLkl.Ol8bKhduIykd/N1xsNNbu	USER	f	\N	\N
cm7kzdf0f001utiezxygpymrl	Atleta Teste 23	atleta23@teste.com	\N	\N	$2b$10$CFJxFnWdxwAfnPnR5wJuyeE2rruYk2bJhAWFgnjy3Wb35.3MSBqVy	USER	f	\N	\N
cm7kzdf2l001xtiezqu3mia26	Atleta Teste 24	atleta24@teste.com	\N	\N	$2b$10$JNzxHam/2Q3UXH36msZDqeEJpbDRyNuGCX0Kh98IOtrWYCHHeMcbS	USER	f	\N	\N
cm7kzdf4y0020tiez5y3u67yw	Atleta Teste 25	atleta25@teste.com	\N	\N	$2b$10$dPmcHgnePkAo7PEuuYILHOPAV9D2iiipsH5be1qWJu0W/e3PTzOp2	USER	f	\N	\N
cm7kzdf7g0023tiez0jprhb07	Atleta Teste 26	atleta26@teste.com	\N	\N	$2b$10$ZEane1go9mX3SNSapX2kreBa1f8izOF/9udAgJDxw0kh5WersQHVC	USER	f	\N	\N
cm7kzdf9q0026tiezxd4bpatf	Atleta Teste 27	atleta27@teste.com	\N	\N	$2b$10$7ZA4tBbFck6Y5LzFF2nxoeUyYnXqGDuwq/W4ai1gbk/BD7wqgXJZm	USER	f	\N	\N
cm7kzdfbp0029tiezaeeegzmp	Atleta Teste 28	atleta28@teste.com	\N	\N	$2b$10$TJbAIrm9Vfb7M7oa6AXBYuycFv8MXsA3W0pdIrBH/CcY3QNF2GDwC	USER	f	\N	\N
cm7kzdfdr002ctiezk8vgk50i	Atleta Teste 29	atleta29@teste.com	\N	\N	$2b$10$q5v99ze9YBjZcebeQbkYkO7wScW4RfMM/udu97u7XzrqPu.Mp.N86	USER	f	\N	\N
cm7kzdffr002ftiezj793qg3z	Atleta Teste 30	atleta30@teste.com	\N	\N	$2b$10$2FtCHhZMaY6m/bdJ5qDQcOChbCqkR5ORffy6/ym04Vu3HjqRmzdte	USER	f	\N	\N
cm7kzdfhq002itiezgt4ano88	Atleta Teste 31	atleta31@teste.com	\N	\N	$2b$10$4DuzUIu8m87q1JiSyWSIFukHj6f8XJfLglOWy/NiP6IE6rt/t6WWi	USER	f	\N	\N
cm7kzdfjq002ltiez6ty1siq1	Atleta Teste 32	atleta32@teste.com	\N	\N	$2b$10$OZ27PEokOQh4OhBLw.B67.iHoGXoPgg3tALLxBHb9H1dQU3jOwV9u	USER	f	\N	\N
cm7kzdflo002otiez7eg27duy	Atleta Teste 33	atleta33@teste.com	\N	\N	$2b$10$4l5sOKNzs1FKIX9GGwsTR.daYMYyRKaVDG6oQPmNFawGgGnYMRq5G	USER	f	\N	\N
cm7kzdfnn002rtiez5hwi4q71	Atleta Teste 34	atleta34@teste.com	\N	\N	$2b$10$Fux2X4jODbr4ySX4vWcvXe9ej9sFRnfCysTEa9z1YwJ2uMEiM9M..	USER	f	\N	\N
cm7kzdfpm002utiezdghdlq28	Atleta Teste 35	atleta35@teste.com	\N	\N	$2b$10$nykHqGgz9gtSaR3H4bUY5eVv.YENyU5jdxeiLwxmjY3mA2gmU2ke.	USER	f	\N	\N
cm7kzdfrp002xtiez6wrr5r2i	Atleta Teste 36	atleta36@teste.com	\N	\N	$2b$10$p8TuC2USePsTG.pZ6alh7.3pB3l8QtlHfyY7NHebZAhnKtuQxM4w.	USER	f	\N	\N
cm7kzdftp0030tiezzj8vxu9u	Atleta Teste 37	atleta37@teste.com	\N	\N	$2b$10$wgBIIQEAAd5KSYqI89kiCOQW87JxDVbVfcrCIE9QRPOLmnT.9xsxi	USER	f	\N	\N
cm7kzdfvx0033tiezmxwzu4a4	Atleta Teste 38	atleta38@teste.com	\N	\N	$2b$10$5mgV9SLu1pVwEhQiSqxjyuNCN2/hbNsofkRSWelZXP2Q44mofYZ.i	USER	f	\N	\N
cm7kzdfxt0036tiezaloztm7t	Atleta Teste 39	atleta39@teste.com	\N	\N	$2b$10$DunCkh/O5yhzmVCtekpECuMO8UrCjQme82GtbC8yPdNVG0u5x0xAe	USER	f	\N	\N
cm7kzdfzt0039tiez66dztr1s	Atleta Teste 40	atleta40@teste.com	\N	\N	$2b$10$b8GoFdaUX17RShlXBvakf.8ph8gBFtiqsqT67.gGkGsLIgp0HoTem	USER	f	\N	\N
cm7kzdg1q003ctiezc7dquzvg	Atleta Teste 41	atleta41@teste.com	\N	\N	$2b$10$RhQY5xRr86VSWUNZbB9xzOXJwEPCHivMxgXJMvyV8OULuyPjMEoMK	USER	f	\N	\N
cm7kzdg3n003ftiez1o7q7w2w	Atleta Teste 42	atleta42@teste.com	\N	\N	$2b$10$B3lT3Tl6hfxiplrJ0qKF3O1GvRb/lF7GLJa8BzIF3QBhSqWJNUJWG	USER	f	\N	\N
cm7kzdg5o003itiezd8s9jzem	Atleta Teste 43	atleta43@teste.com	\N	\N	$2b$10$A6E105tTAbGL8jWuFq7GtulpCbGIZAotvAaj0WOJr8MnZZ0PRMEXW	USER	f	\N	\N
cm7kzdg7n003ltiezsnwdn8f9	Atleta Teste 44	atleta44@teste.com	\N	\N	$2b$10$x11z1OaqE/QG.0Z0NpAd9OLllnTL7WQ20U4LlTeHhD/xiYr8.ZokO	USER	f	\N	\N
cm7kzdg9n003otieznyj866zk	Atleta Teste 45	atleta45@teste.com	\N	\N	$2b$10$clS6Vr1avo5j7NPtwv5wh.TJcATQcbxkl/lYISIpj5u3aAzU64Ixa	USER	f	\N	\N
cm7kzdgc0003rtiezrlfsq2gf	Atleta Teste 46	atleta46@teste.com	\N	\N	$2b$10$GLgmVrYHtU/kLpjiEDnzkeeHcn8lwLBMK08UXc/S7v/amjcQKJpVO	USER	f	\N	\N
cm7kzdgdx003utiezgbcwh7m1	Atleta Teste 47	atleta47@teste.com	\N	\N	$2b$10$QEQqfoRtRb8yfQrk9dzkPuS/FJihrMVaxhBq..lUJSpp4nxOGM5N2	USER	f	\N	\N
cm7kzdgfu003xtieznglmpfyn	Atleta Teste 48	atleta48@teste.com	\N	\N	$2b$10$B.heyYKKsWrqSher8LxsDOPcF2FjlwgvfkXlqZtlWhxShz3lUoLYu	USER	f	\N	\N
cm7kzdded0003tiezwi59ygcp	Atleta Teste 2	atleta2@teste.com	\N	http://localhost:9000/fgc/perfil atleta/284c582b-5432-44db-8dc6-b137eaf6806c.png	$2b$10$XlP.b8SiPGfhIjZTT3jqxO9xa/n9SMyfydw.vxcCrVAVfOxuQ3GFW	USER	f	\N	\N
cm7kzdght0040tiez8ng41zkd	Atleta Teste 49	atleta49@teste.com	\N	\N	$2b$10$5/V19G9VrtbhzVnTrKs1PeNnHCu.12GuGSGMruaVN2FRQ/dEbAOqe	USER	f	\N	\N
cm7kzdgjx0043tiez909ws1d6	Atleta Teste 50	atleta50@teste.com	\N	\N	$2b$10$zpR7KFlmlwcER31wWKUKI.Kxxk7sc8wbO.Cs2K7cPKjeaTyJP25J6	USER	f	\N	\N
cm7kzdglw0046tiezy0fq3pnj	Atleta Teste 51	atleta51@teste.com	\N	\N	$2b$10$fxpoZ/AdjJp483XW7cIC.uuRbCFPcPSuYFKtoBinLCyhBWQJmAYfO	USER	f	\N	\N
618676b6-92ba-4bbc-ac74-e8c31eda70b2	Daniela Costa	temp_618676b6-92ba-4bbc-ac74-e8c31eda70b2@example.com	\N	\N	c7408a36-27fd-44bc-b025-19d5818a8b25	USER	f	\N	\N
823ebfb2-9d8f-49dd-8dc5-ae01e8a6f4a7	Elisa Ferreira	temp_823ebfb2-9d8f-49dd-8dc5-ae01e8a6f4a7@example.com	\N	\N	b42a5d6a-59c7-4b7a-87b6-8d9204e72fd1	USER	f	\N	\N
c1f4f260-66f5-4488-b47d-039f727d5f53	Fernanda Lima	temp_c1f4f260-66f5-4488-b47d-039f727d5f53@example.com	\N	\N	d3fe5b25-30f1-4637-94dc-3300143c7103	USER	f	\N	\N
374a3ca7-20fa-45dd-b108-747f75fd9c42	Gabriela Martins	temp_374a3ca7-20fa-45dd-b108-747f75fd9c42@example.com	\N	\N	345b041a-8ad4-4501-ba70-7f90da9b8067	USER	f	\N	\N
ef260aa5-b4b8-4d12-87fa-56efecd34ab5	Helena Pereira	temp_ef260aa5-b4b8-4d12-87fa-56efecd34ab5@example.com	\N	\N	0fea96c9-385f-4558-96b4-2fa1e3811c21	USER	f	\N	\N
a01c1044-4e63-4f03-9f35-1a25875e244e	Isabela Rodrigues	temp_a01c1044-4e63-4f03-9f35-1a25875e244e@example.com	\N	\N	f3b32432-66ff-4ea6-8958-c48beaa2ae83	USER	f	\N	\N
14904885-43b6-4496-8b8f-52e6c78e2d71	Juliana Almeida	temp_14904885-43b6-4496-8b8f-52e6c78e2d71@example.com	\N	\N	50228853-e38b-44b5-8717-0ab42649364c	USER	f	\N	\N
a7809079-e86c-4aea-b456-0351e194ffa0	Karina Souza	temp_a7809079-e86c-4aea-b456-0351e194ffa0@example.com	\N	\N	46bdc1ca-238b-4f1b-9ae7-6f59fbb02ffe	USER	f	\N	\N
0214a905-cbfc-4a43-bdeb-13e05d4f7ec9	Larissa Mendes	temp_0214a905-cbfc-4a43-bdeb-13e05d4f7ec9@example.com	\N	\N	cb080d9e-bf41-40db-afac-0958ea834b21	USER	f	\N	\N
ae89b198-fe3c-41cd-b10b-f692c577128b	Mariana Cardoso	temp_ae89b198-fe3c-41cd-b10b-f692c577128b@example.com	\N	\N	70a94a6e-c66d-4d4e-97d2-7225d2a3e699	USER	f	\N	\N
b804c957-3887-4d0d-b487-f66e719e2814	Nat├ília Ribeiro	temp_b804c957-3887-4d0d-b487-f66e719e2814@example.com	\N	\N	15bfa1a5-6eaa-40fa-b682-764b9e71baf9	USER	f	\N	\N
e9109ce4-8544-49b5-ba4d-624461e276af	Ol├¡via Gomes	temp_e9109ce4-8544-49b5-ba4d-624461e276af@example.com	\N	\N	097636dd-1ccb-4f89-bec6-20cc347f01f9	USER	f	\N	\N
f6d56698-ba6e-443a-bc8b-43d36b3e0b8c	Ana Silva	temp_f6d56698-ba6e-443a-bc8b-43d36b3e0b8c@example.com	\N	http://localhost:9000/fgc/perfil atleta/d47edcde-3404-4b01-a614-ecac4ecafa40.png	509d96aa-2b63-4e4c-ba82-7e7ae392b224	USER	f	\N	\N
cm7kzdd4g0000tiez3a9g0lok	Atleta Teste 1	atleta1@teste.com	\N	http://localhost:9000/fgc/perfil atleta/f78ada0f-337a-47b6-a5f9-786464cddcb9.png	$2b$10$RS.x2mWJn4OjR1JresPVke7cP7WjMD2BUHpKBOLoFfljVoYsM8V/a	USER	f	\N	\N
eedeba89-5004-4838-acb7-26a60a0f1934	Beatriz Oliveira	temp_eedeba89-5004-4838-acb7-26a60a0f1934@example.com	\N	http://localhost:9000/fgc/perfil atleta/dba713d9-c880-4c70-bde7-25dcb7c71ec5.png	1321dac1-c557-4341-9a46-9b7c3320078b	USER	f	\N	\N
0ae569d4-e20f-4a44-bde3-ef29b05e112f	Weberty Gerolineto	w.betofoto@hotmail.com	\N	\N	$2a$10$uQsE0/kZNMN1iDwz4RBiHuForm.QoU.rNJSZSFxhZqMD7iRsSEq3m	USER	t	4c832113-1796-418a-b402-723bf88d6b62	\N
8d7cdfed-4751-4d1a-9d2b-ca2726835e62	Weberty Gerolineto	w.betofoto@gmail.com	\N	\N	$2a$10$o1mAO7WA56e1s.xMnnfuLOctyO57Ba2ODxD1l7t.ldJI2qwGHRZLO	USER	f	\N	\N
cm7kzddh50006tiezk9ih5dih	Atleta Teste 3	atleta3@teste.com	\N	http://localhost:9000/fgc/perfil atleta/e72c6074-8822-44fb-895c-d812d984df40.png	$2b$10$QbHuDgOwg0Cz19r.B0TuoOkzFQ9oZ/wTXvCMK6DufncDW5VyPFhLC	USER	f	\N	\N
e4da9446-6ebe-4015-aa98-409ffe79fb7b	Carolina Santos	temp_e4da9446-6ebe-4015-aa98-409ffe79fb7b@example.com	\N	http://localhost:9000/fgc/perfil atleta/9076a5b6-6d64-42b5-bb99-410f0d734a95.png	5f6dbfcc-136e-4df1-a1f0-fb064119d9ef	USER	f	\N	\N
5fa9fec3-1936-431d-bbac-faf36c62c043	Administrador	admin@fgc.com.br	2025-02-23 19:09:32.674	https://dev.bemai.com.br/storage/profile/1747313496469-hanirriw.png	$2a$10$jeOhb8iI82GOdRx9mixVAeeUNRJP0tvLnvreT7kZRKRaNVf5l4oJe	SUPER_ADMIN	f	\N	\N
457741f4-177b-471a-ae2c-c8320411e33b	Weberty Gerolineto	betofoto1@gmail.com	2025-02-23 19:09:32.674	https://dev.bemai.com.br/storage/perfil%20atleta/1747508093157-bbrcaskm.jpg	$2a$10$LhqmpNdwdK7fbyXw2SBhDe.RK97HW/L2DJUDdunDAUF0.gOt/w1j.	USER	t	\N	\N
d4640bff-d16b-475d-b9a3-3fe4b93e1779	Teste WhatsApp	teste.whatsapp@example.com	\N	\N	$2a$10$7DCjAiHn3CWAByX.C7zzWeW3i9382WTUSdi52ZvTUYmP4c1yWLyka	USER	f	\N	\N
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- Data for Name: _CategoryToNews; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public."_CategoryToNews" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
9b566fb9-77c6-4275-8c8d-0bb8f383f6e3	63fa7603428fcce5ac0981e3a85ac75ceef14afef108e39cc6b91a1a37e5db58	2025-02-23 16:47:06.401051+00	20250205224218_init	\N	\N	2025-02-23 16:47:05.609956+00	1
2bca8b5b-bfbe-44d2-8fc9-dcc0fe466f3f	49e7295494d829e37eba8fe14eb5411e7f64637cd6f4ba5976c1cde48cec83c3	2025-02-23 16:47:07.114297+00	20250209144310_fix_payment_gateway_relations	\N	\N	2025-02-23 16:47:07.099372+00	1
50da505e-bffd-4c4e-9533-b0b21e79db15	06a7472f9c06267b282f022990d5f20bd2560a478080ab5c2e4f4293b338aed3	2025-02-23 16:47:06.452852+00	20250206174052_add_header_config	\N	\N	2025-02-23 16:47:06.404737+00	1
226627d2-d236-4d74-8b16-eaa40c2c745c	2fb083caa4d567a4412fc04522e19774d218d66f9ff7871a370e6c9efd68f889	2025-02-23 16:47:06.496004+00	20250207001943_add_footer_models	\N	\N	2025-02-23 16:47:06.457449+00	1
0324ed86-1bf1-44e7-88e4-612721cc978a	59770f5abb2b2a15243e7b42bbebc962de31cf7cdcdfbb854963d098a0d6b8ba	2025-02-23 16:47:07.333854+00	20250214133532_add_payment_model	\N	\N	2025-02-23 16:47:07.291284+00	1
7fa5c070-f3aa-4ef8-bd39-d761df072494	122d743a0403e77ad7e0ed9447f5b8826f2fbdbc55612d936eff004dd13c2eec	2025-02-23 16:47:06.504533+00	20250207003614_add_footer_tables	\N	\N	2025-02-23 16:47:06.49911+00	1
c9969974-62e4-4d4f-b635-676b35984fc8	0986971ec19b85ce5cac559841262ca5d1fb0030e5df38f0c720f9175ce3d471	2025-02-23 16:47:07.134922+00	20250210_add_gateway_priority	\N	\N	2025-02-23 16:47:07.118595+00	1
0ac26bfd-e0a0-4712-8c8c-22b4f6e35072	122d743a0403e77ad7e0ed9447f5b8826f2fbdbc55612d936eff004dd13c2eec	2025-02-23 16:47:06.520005+00	20250207121901_complete_structure	\N	\N	2025-02-23 16:47:06.508614+00	1
4160244e-55f1-44f9-afc3-6ab2df8d4546	0eaa10f56b581d3d3f1af5662621b96c828f68bc3f2f2730f583c2403d25e6ff	2025-02-23 16:47:06.718124+00	20250207122114_complete_structure	\N	\N	2025-02-23 16:47:06.523609+00	1
c9fed513-87cc-4a7a-b5dd-5079e952ff16	be3d1c1ee911402fc5dba0ca43229c67628757f96049f4b1c6c6ff1c4d194f6f	2025-02-23 16:47:06.746777+00	20250207173100_add_legal_documents	\N	\N	2025-02-23 16:47:06.72148+00	1
72632478-1000-4f10-b015-bd4bf230ca11	ec23ffee581d089e00969e6ae5e32d5c2147a0f20a4b9d2c68a1b5d02c43f54b	2025-02-23 16:47:07.158938+00	20250212010239_fix_payment_gateway_credentials	\N	\N	2025-02-23 16:47:07.138811+00	1
731e744b-0be3-4302-a0b8-32af8b0e0d45	2c93d8244950832c9288355f1b921815ac887ef298da29fd5e1f60150b636385	2025-02-23 16:47:06.759636+00	20250207173200_add_legal_documents_initial_data	\N	\N	2025-02-23 16:47:06.749827+00	1
8643207a-c0b3-4557-83cf-ed2996ece324	95a5f9f6121ab7882d1efae1d3d7d24cd4617ea15f3fd06d434060a2d6009db1	2025-02-23 16:47:06.771116+00	20250207183246_add_footer_address_info	\N	\N	2025-02-23 16:47:06.763574+00	1
f1e02ece-92d0-43dc-b191-5016d5b6789e	5792c23116c29e31a1a17690f22787b62e96cc3f4f9f724a3f969e711975c2d8	2025-02-23 16:47:06.785328+00	20250207183601_add_footer_contact_info	\N	\N	2025-02-23 16:47:06.776901+00	1
608a2281-2b5f-4914-99ac-706a80d1c612	b45f8866c85ef3cf677812ffed3851b2dd11678e4c337facb0094a1d7f7135df	2025-02-23 16:47:07.202073+00	20250213173500_update_payment_gateway_config	\N	\N	2025-02-23 16:47:07.168843+00	1
59ef7951-9a54-414b-885e-49e264070d37	126344855a40e8c0435d6ddbe0b05d04034c9dd191bcb5df725957ebc99f12f3	2025-02-23 16:47:06.844607+00	20250208114229_add_filiation_system	\N	\N	2025-02-23 16:47:06.788121+00	1
168b8ebc-f071-456b-b339-a327c4d69273	09f962dc5fe6c4ace3c7abf2c9c32f092e5942fcdd3c211506381fc73d4a307c	2025-02-23 16:47:06.921168+00	20250208180449_add_payment_system	\N	\N	2025-02-23 16:47:06.848112+00	1
5669d051-7dee-4aaa-be79-927d4b5fa89a	44fa01618e22073ef1a820c907233f0526460ae35bd7568d2e1bc6c91b823f25	2025-02-23 16:47:07.095822+00	20250208234051_add_notification_config_and_templates	\N	\N	2025-02-23 16:47:06.9264+00	1
d7bd2261-fbbc-409f-9a68-93a6ae83f595	509f2ed28328929a5a8be4ee8aaa59d86a43b90206e84fa77aec995eba09f316	2025-02-23 16:47:07.219282+00	20250213203533_update_payment_gateway_config	\N	\N	2025-02-23 16:47:07.204989+00	1
32273667-213c-4ae0-bd48-2c44169bc9e2	4e32f85bd1faeaa5cf26272d53357ecbc327e06aacddcd5d1261df048293ce3e	2025-02-23 16:47:07.234308+00	20250213231521_fix_gateway_json_fields	\N	\N	2025-02-23 16:47:07.22374+00	1
0674702d-1879-49ac-971b-079e3aa157d8	3d284e61fc85ff1c589bc2a4aed48fc06d61e65a1cb5bc4db3952e6f8ddda5c5	2025-02-23 16:47:07.254009+00	20250214001444_fix_gateway_json_fields_v2	\N	\N	2025-02-23 16:47:07.237039+00	1
907410f0-204a-499f-91fa-b7428be86e5d	70abc9e4239cf39abe3bcc9226da887ae2336dd23cc07219fa162ebd172cdde6	2025-02-23 16:47:07.286884+00	20250214120558_add_payment_table	\N	\N	2025-02-23 16:47:07.261171+00	1
f69686ce-95d2-405b-bce2-cedc37115a53	da52eddfcee3b9dbcb169ba8228f5f35c964495326dfab3c36661939563c5a16	\N	20250214204100_update_payment_enums	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250214204100_update_payment_enums\n\nDatabase error code: 22P02\n\nDatabase error:\nERROR: invalid input value for enum "PaymentEntityType": "ATHLETE_REGISTRATION"\n\nPosition:\n[1m  0[0m\n[1m  1[0m -- Atualizar registros existentes\n[1m  2[0m UPDATE "PaymentTransaction"\n[1m  3[1;31m SET "entityType" = 'ATHLETE_REGISTRATION'[0m\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E22P02), message: "invalid input value for enum \\"PaymentEntityType\\": \\"ATHLETE_REGISTRATION\\"", detail: None, hint: None, position: Some(Original(84)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("enum.c"), line: Some(129), routine: Some("enum_in") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250214204100_update_payment_enums"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20250214204100_update_payment_enums"\n             at schema-engine\\core\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:226	2025-03-01 23:21:14.080336+00	2025-02-23 16:47:07.336689+00	0
08756e29-785c-4c3a-aa34-c726f574a9a9	da52eddfcee3b9dbcb169ba8228f5f35c964495326dfab3c36661939563c5a16	2025-03-01 23:21:14.106797+00	20250214204100_update_payment_enums		\N	2025-03-01 23:21:14.106797+00	0
ce7ec0eb-ec39-4d19-a848-ce3db4274141	3705093accb81237ca905481d59967e4f5bba060000b4a3e4455cfb9155c4412	2025-03-01 23:21:28.075976+00	20250214204200_create_transaction	\N	\N	2025-03-01 23:21:27.979786+00	1
dcd1be89-3b59-4f51-98cc-8496184b6ca3	087565a0768ca7b579ba25175c4e8f371c08c48704b36c8f4b39eb673c733f14	\N	20250214205800_update_payment_structure	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250214205800_update_payment_structure\n\nDatabase error code: 42883\n\nDatabase error:\nERROR: operator does not exist: "PaymentMethod" = text\nHINT: No operator matches the given name and argument types. You might need to add explicit type casts.\n\nPosition:\n[1m 14[0m );\n[1m 15[0m\n[1m 16[0m -- Step 2: Atualizar registros existentes para usar valores compat├¡veis\n[1m 17[0m UPDATE "PaymentTransaction" \n[1m 18[0m SET "paymentMethod" = 'CREDIT_CARD'::text \n[1m 19[1;31m WHERE "paymentMethod" = 'DEBIT_CARD'::text;[0m\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42883), message: "operator does not exist: \\"PaymentMethod\\" = text", detail: None, hint: Some("No operator matches the given name and argument types. You might need to add explicit type casts."), position: Some(Original(517)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("parse_oper.c"), line: Some(647), routine: Some("op_error") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250214205800_update_payment_structure"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20250214205800_update_payment_structure"\n             at schema-engine\\core\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:226	2025-03-01 23:21:42.791196+00	2025-03-01 23:21:28.083124+00	0
84796a17-a39d-4559-a9ec-90936f791385	087565a0768ca7b579ba25175c4e8f371c08c48704b36c8f4b39eb673c733f14	2025-03-01 23:21:42.795951+00	20250214205800_update_payment_structure		\N	2025-03-01 23:21:42.795951+00	0
3de47628-12af-421d-add8-102081ddd1e9	c74296e0d80a7b90dae829aa8244e1fe34f788f73907208c9e25d70189c82739	\N	20250214205900_update_payment_structure_v2	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250214205900_update_payment_structure_v2\n\nDatabase error code: 2BP01\n\nDatabase error:\nERROR: cannot drop type "PaymentStatus" because other objects depend on it\nDETAIL: column status of table "PaymentHistory" depends on type "PaymentStatus"\ndefault value for column status of table "PaymentTransaction" depends on type "PaymentStatus"\nHINT: Use DROP ... CASCADE to drop the dependent objects too.\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E2BP01), message: "cannot drop type \\"PaymentStatus\\" because other objects depend on it", detail: Some("column status of table \\"PaymentHistory\\" depends on type \\"PaymentStatus\\"\\ndefault value for column status of table \\"PaymentTransaction\\" depends on type \\"PaymentStatus\\""), hint: Some("Use DROP ... CASCADE to drop the dependent objects too."), position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("dependency.c"), line: Some(1204), routine: Some("reportDependentObjects") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250214205900_update_payment_structure_v2"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20250214205900_update_payment_structure_v2"\n             at schema-engine\\core\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:226	2025-03-01 23:22:06.683853+00	2025-03-01 23:21:51.960666+00	0
7e4a35d5-3549-4051-bc9a-4dc54b18be28	c74296e0d80a7b90dae829aa8244e1fe34f788f73907208c9e25d70189c82739	2025-03-01 23:22:06.687593+00	20250214205900_update_payment_structure_v2		\N	2025-03-01 23:22:06.687593+00	0
adbed0ef-bf2f-479e-b40a-ff0dcf9309d0	c14128bfa09c53583b889a436bdcab2b54523096ad8eb2332914d5ea40b32201	2025-03-01 23:22:14.514978+00	20250214210000_update_payment_structure_v3		\N	2025-03-01 23:22:14.514978+00	0
f006ca6c-b1b5-47b8-9f46-58a5e0d5c1b9	2dc82c2a7daa32025ea0f7420f4034ef3f77506b6100efe84fdf9be4384d173d	2025-03-01 23:22:25.56448+00	20250223000000_initial_schema		\N	2025-03-01 23:22:25.56448+00	0
23f890e0-9023-4758-b82f-ac06f3f62ca4	c96dde9a574be9800aa6423cc402c468ed2de4a5a081602f6586dc88d01ee9e6	2025-03-01 23:22:35.5185+00	20250223143000_add_event_poster_image		\N	2025-03-01 23:22:35.5185+00	0
f47a8d39-e2d0-4a7f-9b92-5a320af8605e	576ef3ff831b191c1b8fdbc5bca56e4a761fb1a9c7550d543aa6a6c8978e59fb	2025-03-01 23:22:46.786281+00	20250225_add_event_modality_category	\N	\N	2025-03-01 23:22:44.309401+00	1
\.


--
-- Data for Name: newsimage; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public.newsimage (id, news_id, url, alt, image_order, created_at) FROM stdin;
c8dc65b7-7cdd-40c5-80a8-e4991db699c1	4f2712a9-9072-46c0-bf5f-320e916c5953	https://dev.bemai.com.br/storage/noticias/1747229768716-6oyw7ixg.png	\N	0	2025-05-14 13:36:09.432
\.


--
-- Data for Name: payment_system_config; Type: TABLE DATA; Schema: public; Owner: fgc
--

COPY public.payment_system_config (id, "notificationEmails", "updatedAt") FROM stdin;
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: AthleteGallery AthleteGallery_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."AthleteGallery"
    ADD CONSTRAINT "AthleteGallery_pkey" PRIMARY KEY (id);


--
-- Name: AthleteProfile AthleteProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."AthleteProfile"
    ADD CONSTRAINT "AthleteProfile_pkey" PRIMARY KEY (id);


--
-- Name: AthleteStatusHistory AthleteStatusHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."AthleteStatusHistory"
    ADD CONSTRAINT "AthleteStatusHistory_pkey" PRIMARY KEY (id);


--
-- Name: Athlete Athlete_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Athlete"
    ADD CONSTRAINT "Athlete_pkey" PRIMARY KEY (id);


--
-- Name: AthletesSectionBanner AthletesSectionBanner_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."AthletesSectionBanner"
    ADD CONSTRAINT "AthletesSectionBanner_pkey" PRIMARY KEY (id);


--
-- Name: Banner Banner_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Banner"
    ADD CONSTRAINT "Banner_pkey" PRIMARY KEY (id);


--
-- Name: CalendarEvent CalendarEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."CalendarEvent"
    ADD CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: ChampionCategory ChampionCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ChampionCategory"
    ADD CONSTRAINT "ChampionCategory_pkey" PRIMARY KEY (id);


--
-- Name: ChampionEntry ChampionEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ChampionEntry"
    ADD CONSTRAINT "ChampionEntry_pkey" PRIMARY KEY (id);


--
-- Name: ChampionModality ChampionModality_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ChampionModality"
    ADD CONSTRAINT "ChampionModality_pkey" PRIMARY KEY (id);


--
-- Name: Champion Champion_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Champion"
    ADD CONSTRAINT "Champion_pkey" PRIMARY KEY (id);


--
-- Name: ChampionshipEvent ChampionshipEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ChampionshipEvent"
    ADD CONSTRAINT "ChampionshipEvent_pkey" PRIMARY KEY (id);


--
-- Name: City City_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."City"
    ADD CONSTRAINT "City_pkey" PRIMARY KEY (id);


--
-- Name: ClubFeeSettings ClubFeeSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ClubFeeSettings"
    ADD CONSTRAINT "ClubFeeSettings_pkey" PRIMARY KEY (id);


--
-- Name: Club Club_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Club"
    ADD CONSTRAINT "Club_pkey" PRIMARY KEY (id);


--
-- Name: Country Country_code_key; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Country"
    ADD CONSTRAINT "Country_code_key" UNIQUE (code);


--
-- Name: Country Country_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Country"
    ADD CONSTRAINT "Country_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: EmailVerification EmailVerification_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EmailVerification"
    ADD CONSTRAINT "EmailVerification_pkey" PRIMARY KEY (id);


--
-- Name: EmailVerification EmailVerification_token_key; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EmailVerification"
    ADD CONSTRAINT "EmailVerification_token_key" UNIQUE (token);


--
-- Name: EmailVerification EmailVerification_userId_key; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EmailVerification"
    ADD CONSTRAINT "EmailVerification_userId_key" UNIQUE ("userId");


--
-- Name: EventCategory EventCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventCategory"
    ADD CONSTRAINT "EventCategory_pkey" PRIMARY KEY (id);


--
-- Name: EventCouponUsage EventCouponUsage_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventCouponUsage"
    ADD CONSTRAINT "EventCouponUsage_pkey" PRIMARY KEY (id);


--
-- Name: EventDiscountCoupon EventDiscountCoupon_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventDiscountCoupon"
    ADD CONSTRAINT "EventDiscountCoupon_pkey" PRIMARY KEY (id);


--
-- Name: EventModalityToCategory EventModalityToCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventModalityToCategory"
    ADD CONSTRAINT "EventModalityToCategory_pkey" PRIMARY KEY ("modalityId", "categoryId");


--
-- Name: EventModality EventModality_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventModality"
    ADD CONSTRAINT "EventModality_pkey" PRIMARY KEY (id);


--
-- Name: EventPricingByCategory EventPricingByCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventPricingByCategory"
    ADD CONSTRAINT "EventPricingByCategory_pkey" PRIMARY KEY (id);


--
-- Name: EventPricingTier EventPricingTier_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventPricingTier"
    ADD CONSTRAINT "EventPricingTier_pkey" PRIMARY KEY (id);


--
-- Name: EventToCategory EventToCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventToCategory"
    ADD CONSTRAINT "EventToCategory_pkey" PRIMARY KEY (id);


--
-- Name: EventToGender EventToGender_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventToGender"
    ADD CONSTRAINT "EventToGender_pkey" PRIMARY KEY (id);


--
-- Name: EventToModality EventToModality_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventToModality"
    ADD CONSTRAINT "EventToModality_pkey" PRIMARY KEY (id);


--
-- Name: EventTopResult EventTopResult_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventTopResult"
    ADD CONSTRAINT "EventTopResult_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: FiliationAnnualConfig FiliationAnnualConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."FiliationAnnualConfig"
    ADD CONSTRAINT "FiliationAnnualConfig_pkey" PRIMARY KEY (id);


--
-- Name: FiliationAnnualConfig FiliationAnnualConfig_year_key; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."FiliationAnnualConfig"
    ADD CONSTRAINT "FiliationAnnualConfig_year_key" UNIQUE (year);


--
-- Name: FiliationBanner FiliationBanner_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."FiliationBanner"
    ADD CONSTRAINT "FiliationBanner_pkey" PRIMARY KEY (id);


--
-- Name: FiliationCategory FiliationCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."FiliationCategory"
    ADD CONSTRAINT "FiliationCategory_pkey" PRIMARY KEY (id);


--
-- Name: FiliationConfig FiliationConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."FiliationConfig"
    ADD CONSTRAINT "FiliationConfig_pkey" PRIMARY KEY (id);


--
-- Name: FiliationModality FiliationModality_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."FiliationModality"
    ADD CONSTRAINT "FiliationModality_pkey" PRIMARY KEY (id);


--
-- Name: FooterConfig FooterConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."FooterConfig"
    ADD CONSTRAINT "FooterConfig_pkey" PRIMARY KEY (id);


--
-- Name: FooterMenu FooterMenu_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."FooterMenu"
    ADD CONSTRAINT "FooterMenu_pkey" PRIMARY KEY (id);


--
-- Name: GalleryEvent GalleryEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."GalleryEvent"
    ADD CONSTRAINT "GalleryEvent_pkey" PRIMARY KEY (id);


--
-- Name: GalleryEvent GalleryEvent_slug_key; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."GalleryEvent"
    ADD CONSTRAINT "GalleryEvent_slug_key" UNIQUE (slug);


--
-- Name: GalleryImage GalleryImage_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."GalleryImage"
    ADD CONSTRAINT "GalleryImage_pkey" PRIMARY KEY (id);


--
-- Name: Gender Gender_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Gender"
    ADD CONSTRAINT "Gender_pkey" PRIMARY KEY (id);


--
-- Name: HeaderConfig HeaderConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."HeaderConfig"
    ADD CONSTRAINT "HeaderConfig_pkey" PRIMARY KEY (id);


--
-- Name: HeaderMenu HeaderMenu_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."HeaderMenu"
    ADD CONSTRAINT "HeaderMenu_pkey" PRIMARY KEY (id);


--
-- Name: Indicator Indicator_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Indicator"
    ADD CONSTRAINT "Indicator_pkey" PRIMARY KEY (id);


--
-- Name: LegalDocuments LegalDocuments_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."LegalDocuments"
    ADD CONSTRAINT "LegalDocuments_pkey" PRIMARY KEY (id);


--
-- Name: ModalityCategoryGender ModalityCategoryGender_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ModalityCategoryGender"
    ADD CONSTRAINT "ModalityCategoryGender_pkey" PRIMARY KEY (id);


--
-- Name: ModalityToCategory ModalityToCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ModalityToCategory"
    ADD CONSTRAINT "ModalityToCategory_pkey" PRIMARY KEY ("modalityId", "categoryId");


--
-- Name: News News_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."News"
    ADD CONSTRAINT "News_pkey" PRIMARY KEY (id);


--
-- Name: NotificationAttempt NotificationAttempt_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."NotificationAttempt"
    ADD CONSTRAINT "NotificationAttempt_pkey" PRIMARY KEY (id);


--
-- Name: NotificationConfig NotificationConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."NotificationConfig"
    ADD CONSTRAINT "NotificationConfig_pkey" PRIMARY KEY (id);


--
-- Name: NotificationLog NotificationLog_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."NotificationLog"
    ADD CONSTRAINT "NotificationLog_pkey" PRIMARY KEY (id);


--
-- Name: NotificationTemplate NotificationTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."NotificationTemplate"
    ADD CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Partner Partner_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Partner"
    ADD CONSTRAINT "Partner_pkey" PRIMARY KEY (id);


--
-- Name: PasswordReset PasswordReset_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."PasswordReset"
    ADD CONSTRAINT "PasswordReset_pkey" PRIMARY KEY (id);


--
-- Name: PasswordReset PasswordReset_userId_key; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."PasswordReset"
    ADD CONSTRAINT "PasswordReset_userId_key" UNIQUE ("userId");


--
-- Name: PaymentGatewayConfig PaymentGatewayConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."PaymentGatewayConfig"
    ADD CONSTRAINT "PaymentGatewayConfig_pkey" PRIMARY KEY (id);


--
-- Name: PaymentHistory PaymentHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."PaymentHistory"
    ADD CONSTRAINT "PaymentHistory_pkey" PRIMARY KEY (id);


--
-- Name: PaymentTransaction PaymentTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."PaymentTransaction"
    ADD CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: ProtocolSequence ProtocolSequence_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ProtocolSequence"
    ADD CONSTRAINT "ProtocolSequence_pkey" PRIMARY KEY (id);


--
-- Name: Protocol Protocol_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Protocol"
    ADD CONSTRAINT "Protocol_pkey" PRIMARY KEY (id);


--
-- Name: RankingCategory RankingCategory_name_modalityId_key; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingCategory"
    ADD CONSTRAINT "RankingCategory_name_modalityId_key" UNIQUE (name, "modalityId");


--
-- Name: RankingCategory RankingCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingCategory"
    ADD CONSTRAINT "RankingCategory_pkey" PRIMARY KEY (id);


--
-- Name: RankingConfiguration RankingConfiguration_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingConfiguration"
    ADD CONSTRAINT "RankingConfiguration_pkey" PRIMARY KEY (id);


--
-- Name: RankingConfiguration RankingConfiguration_unique_ranking; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingConfiguration"
    ADD CONSTRAINT "RankingConfiguration_unique_ranking" UNIQUE ("modalityId", "categoryId", gender, season);


--
-- Name: RankingEntry RankingEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingEntry"
    ADD CONSTRAINT "RankingEntry_pkey" PRIMARY KEY (id);


--
-- Name: RankingEntry RankingEntry_unique_athlete; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingEntry"
    ADD CONSTRAINT "RankingEntry_unique_athlete" UNIQUE ("configurationId", "athleteId");


--
-- Name: RankingModality RankingModality_name_key; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingModality"
    ADD CONSTRAINT "RankingModality_name_key" UNIQUE (name);


--
-- Name: RankingModality RankingModality_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingModality"
    ADD CONSTRAINT "RankingModality_pkey" PRIMARY KEY (id);


--
-- Name: RankingStageResult RankingStageResult_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingStageResult"
    ADD CONSTRAINT "RankingStageResult_pkey" PRIMARY KEY (id);


--
-- Name: Ranking Ranking_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Ranking"
    ADD CONSTRAINT "Ranking_pkey" PRIMARY KEY (id);


--
-- Name: Registration Registration_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_pkey" PRIMARY KEY (id);


--
-- Name: Registration Registration_protocol_key; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_protocol_key" UNIQUE (protocol);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: SmallBanner SmallBanner_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."SmallBanner"
    ADD CONSTRAINT "SmallBanner_pkey" PRIMARY KEY (id);


--
-- Name: Sponsor Sponsor_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Sponsor"
    ADD CONSTRAINT "Sponsor_pkey" PRIMARY KEY (id);


--
-- Name: State State_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."State"
    ADD CONSTRAINT "State_pkey" PRIMARY KEY (id);


--
-- Name: TempRegistration TempRegistration_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."TempRegistration"
    ADD CONSTRAINT "TempRegistration_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _CategoryToNews _CategoryToNews_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."_CategoryToNews"
    ADD CONSTRAINT "_CategoryToNews_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: newsimage newsimage_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public.newsimage
    ADD CONSTRAINT newsimage_pkey PRIMARY KEY (id);


--
-- Name: payment_system_config payment_system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public.payment_system_config
    ADD CONSTRAINT payment_system_config_pkey PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: AthleteGallery_athleteId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "AthleteGallery_athleteId_idx" ON public."AthleteGallery" USING btree ("athleteId");


--
-- Name: AthleteGallery_order_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "AthleteGallery_order_idx" ON public."AthleteGallery" USING btree ("order");


--
-- Name: AthleteProfile_athleteId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "AthleteProfile_athleteId_idx" ON public."AthleteProfile" USING btree ("athleteId");


--
-- Name: AthleteProfile_athleteId_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "AthleteProfile_athleteId_key" ON public."AthleteProfile" USING btree ("athleteId");


--
-- Name: AthleteProfile_gender_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "AthleteProfile_gender_idx" ON public."AthleteProfile" USING btree (gender);


--
-- Name: Athlete_cpf_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "Athlete_cpf_key" ON public."Athlete" USING btree (cpf);


--
-- Name: Athlete_userId_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "Athlete_userId_key" ON public."Athlete" USING btree ("userId");


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."Category" USING btree (slug);


--
-- Name: ChampionCategory_modalityId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "ChampionCategory_modalityId_idx" ON public."ChampionCategory" USING btree ("modalityId");


--
-- Name: ChampionEntry_athleteId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "ChampionEntry_athleteId_idx" ON public."ChampionEntry" USING btree ("athleteId");


--
-- Name: ChampionEntry_eventId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "ChampionEntry_eventId_idx" ON public."ChampionEntry" USING btree ("eventId");


--
-- Name: ChampionEntry_modality_category_gender_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "ChampionEntry_modality_category_gender_idx" ON public."ChampionEntry" USING btree ("modalityId", "categoryId", gender);


--
-- Name: Champion_athleteId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Champion_athleteId_idx" ON public."Champion" USING btree ("athleteId");


--
-- Name: Champion_modality_category_gender_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Champion_modality_category_gender_idx" ON public."Champion" USING btree (modality, category, gender);


--
-- Name: Champion_year_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Champion_year_idx" ON public."Champion" USING btree (year);


--
-- Name: ChampionshipEvent_year_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "ChampionshipEvent_year_idx" ON public."ChampionshipEvent" USING btree (year);


--
-- Name: City_stateId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "City_stateId_idx" ON public."City" USING btree ("stateId");


--
-- Name: Club_cnpj_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "Club_cnpj_key" ON public."Club" USING btree (cnpj);


--
-- Name: Country_code_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Country_code_idx" ON public."Country" USING btree (code);


--
-- Name: Document_category_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Document_category_idx" ON public."Document" USING btree (category);


--
-- Name: EmailVerification_token_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EmailVerification_token_idx" ON public."EmailVerification" USING btree (token);


--
-- Name: EventCouponUsage_couponId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventCouponUsage_couponId_idx" ON public."EventCouponUsage" USING btree ("couponId");


--
-- Name: EventCouponUsage_registrationId_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "EventCouponUsage_registrationId_key" ON public."EventCouponUsage" USING btree ("registrationId");


--
-- Name: EventDiscountCoupon_code_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventDiscountCoupon_code_idx" ON public."EventDiscountCoupon" USING btree (code);


--
-- Name: EventDiscountCoupon_eventId_code_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "EventDiscountCoupon_eventId_code_key" ON public."EventDiscountCoupon" USING btree ("eventId", code);


--
-- Name: EventDiscountCoupon_eventId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventDiscountCoupon_eventId_idx" ON public."EventDiscountCoupon" USING btree ("eventId");


--
-- Name: EventModalityToCategory_categoryId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventModalityToCategory_categoryId_idx" ON public."EventModalityToCategory" USING btree ("categoryId");


--
-- Name: EventModalityToCategory_modalityId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventModalityToCategory_modalityId_idx" ON public."EventModalityToCategory" USING btree ("modalityId");


--
-- Name: EventModality_name_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "EventModality_name_key" ON public."EventModality" USING btree (name);


--
-- Name: EventPricingByCategory_eventId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventPricingByCategory_eventId_idx" ON public."EventPricingByCategory" USING btree ("eventId");


--
-- Name: EventPricingByCategory_eventId_modalityId_categoryId_genderId_t; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "EventPricingByCategory_eventId_modalityId_categoryId_genderId_t" ON public."EventPricingByCategory" USING btree ("eventId", "modalityId", "categoryId", "genderId", "tierId");


--
-- Name: EventPricingByCategory_modalityId_categoryId_genderId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventPricingByCategory_modalityId_categoryId_genderId_idx" ON public."EventPricingByCategory" USING btree ("modalityId", "categoryId", "genderId");


--
-- Name: EventPricingTier_eventId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventPricingTier_eventId_idx" ON public."EventPricingTier" USING btree ("eventId");


--
-- Name: EventPricingTier_startDate_endDate_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventPricingTier_startDate_endDate_idx" ON public."EventPricingTier" USING btree ("startDate", "endDate");


--
-- Name: EventToCategory_categoryId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventToCategory_categoryId_idx" ON public."EventToCategory" USING btree ("categoryId");


--
-- Name: EventToCategory_eventId_categoryId_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "EventToCategory_eventId_categoryId_key" ON public."EventToCategory" USING btree ("eventId", "categoryId");


--
-- Name: EventToCategory_eventId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventToCategory_eventId_idx" ON public."EventToCategory" USING btree ("eventId");


--
-- Name: EventToGender_eventId_genderId_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "EventToGender_eventId_genderId_key" ON public."EventToGender" USING btree ("eventId", "genderId");


--
-- Name: EventToGender_eventId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventToGender_eventId_idx" ON public."EventToGender" USING btree ("eventId");


--
-- Name: EventToGender_genderId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventToGender_genderId_idx" ON public."EventToGender" USING btree ("genderId");


--
-- Name: EventToModality_eventId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventToModality_eventId_idx" ON public."EventToModality" USING btree ("eventId");


--
-- Name: EventToModality_eventId_modalityId_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "EventToModality_eventId_modalityId_key" ON public."EventToModality" USING btree ("eventId", "modalityId");


--
-- Name: EventToModality_modalityId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventToModality_modalityId_idx" ON public."EventToModality" USING btree ("modalityId");


--
-- Name: EventTopResult_categoryId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventTopResult_categoryId_idx" ON public."EventTopResult" USING btree ("categoryId");


--
-- Name: EventTopResult_clubId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventTopResult_clubId_idx" ON public."EventTopResult" USING btree ("clubId");


--
-- Name: EventTopResult_eventId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventTopResult_eventId_idx" ON public."EventTopResult" USING btree ("eventId");


--
-- Name: EventTopResult_userId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "EventTopResult_userId_idx" ON public."EventTopResult" USING btree ("userId");


--
-- Name: Event_categoryId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Event_categoryId_idx" ON public."Event" USING btree ("categoryId");


--
-- Name: Event_createdAt_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Event_createdAt_idx" ON public."Event" USING btree ("createdAt");


--
-- Name: Event_modalityId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Event_modalityId_idx" ON public."Event" USING btree ("modalityId");


--
-- Name: Event_organizerId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Event_organizerId_idx" ON public."Event" USING btree ("organizerId");


--
-- Name: FiliationBanner_active_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "FiliationBanner_active_idx" ON public."FiliationBanner" USING btree (active);


--
-- Name: FiliationBanner_type_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "FiliationBanner_type_idx" ON public."FiliationBanner" USING btree (type);


--
-- Name: FiliationCategory_name_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "FiliationCategory_name_key" ON public."FiliationCategory" USING btree (name);


--
-- Name: FiliationModality_name_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "FiliationModality_name_key" ON public."FiliationModality" USING btree (name);


--
-- Name: FooterMenu_footerId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "FooterMenu_footerId_idx" ON public."FooterMenu" USING btree ("footerId");


--
-- Name: GalleryEvent_modality_category_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "GalleryEvent_modality_category_idx" ON public."GalleryEvent" USING btree (modality, category);


--
-- Name: GalleryImage_eventId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "GalleryImage_eventId_idx" ON public."GalleryImage" USING btree ("eventId");


--
-- Name: Gender_code_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "Gender_code_key" ON public."Gender" USING btree (code);


--
-- Name: HeaderMenu_headerId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "HeaderMenu_headerId_idx" ON public."HeaderMenu" USING btree ("headerId");


--
-- Name: IDX_AthleteStatusHistory_athleteId; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "IDX_AthleteStatusHistory_athleteId" ON public."AthleteStatusHistory" USING btree ("athleteId");


--
-- Name: IDX_AthleteStatusHistory_createdAt; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "IDX_AthleteStatusHistory_createdAt" ON public."AthleteStatusHistory" USING btree ("createdAt");


--
-- Name: IDX_AthleteStatusHistory_newClubId; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "IDX_AthleteStatusHistory_newClubId" ON public."AthleteStatusHistory" USING btree ("newClubId");


--
-- Name: IDX_AthleteStatusHistory_previousClubId; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "IDX_AthleteStatusHistory_previousClubId" ON public."AthleteStatusHistory" USING btree ("previousClubId");


--
-- Name: IDX_Athlete_clubId; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "IDX_Athlete_clubId" ON public."Athlete" USING btree ("clubId");


--
-- Name: IDX_Athlete_expirationDate; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "IDX_Athlete_expirationDate" ON public."Athlete" USING btree ("expirationDate");


--
-- Name: IDX_Athlete_registeredByUserId; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "IDX_Athlete_registeredByUserId" ON public."Athlete" USING btree ("registeredByUserId");


--
-- Name: IDX_Athlete_registrationYear; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "IDX_Athlete_registrationYear" ON public."Athlete" USING btree ("registrationYear");


--
-- Name: LegalDocuments_type_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "LegalDocuments_type_key" ON public."LegalDocuments" USING btree (type);


--
-- Name: ModalityCategoryGender_categoryId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "ModalityCategoryGender_categoryId_idx" ON public."ModalityCategoryGender" USING btree ("categoryId");


--
-- Name: ModalityCategoryGender_genderId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "ModalityCategoryGender_genderId_idx" ON public."ModalityCategoryGender" USING btree ("genderId");


--
-- Name: ModalityCategoryGender_modalityId_categoryId_genderId_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "ModalityCategoryGender_modalityId_categoryId_genderId_key" ON public."ModalityCategoryGender" USING btree ("modalityId", "categoryId", "genderId");


--
-- Name: ModalityCategoryGender_modalityId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "ModalityCategoryGender_modalityId_idx" ON public."ModalityCategoryGender" USING btree ("modalityId");


--
-- Name: ModalityToCategory_categoryId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "ModalityToCategory_categoryId_idx" ON public."ModalityToCategory" USING btree ("categoryId");


--
-- Name: News_authorId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "News_authorId_idx" ON public."News" USING btree ("authorId");


--
-- Name: News_publishedAt_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "News_publishedAt_idx" ON public."News" USING btree ("publishedAt");


--
-- Name: News_slug_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "News_slug_key" ON public."News" USING btree (slug);


--
-- Name: NotificationAttempt_channel_success_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "NotificationAttempt_channel_success_idx" ON public."NotificationAttempt" USING btree (channel, success);


--
-- Name: NotificationAttempt_notificationId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "NotificationAttempt_notificationId_idx" ON public."NotificationAttempt" USING btree ("notificationId");


--
-- Name: NotificationLog_sentAt_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "NotificationLog_sentAt_idx" ON public."NotificationLog" USING btree ("sentAt");


--
-- Name: NotificationLog_type_status_channel_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "NotificationLog_type_status_channel_idx" ON public."NotificationLog" USING btree (type, status, channel);


--
-- Name: NotificationTemplate_type_channel_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "NotificationTemplate_type_channel_key" ON public."NotificationTemplate" USING btree (type, channel);


--
-- Name: Notification_createdAt_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Notification_createdAt_idx" ON public."Notification" USING btree ("createdAt");


--
-- Name: Notification_type_status_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Notification_type_status_idx" ON public."Notification" USING btree (type, status);


--
-- Name: Partner_order_active_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Partner_order_active_idx" ON public."Partner" USING btree ("order", active);


--
-- Name: PasswordReset_token_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "PasswordReset_token_idx" ON public."PasswordReset" USING btree (token);


--
-- Name: PasswordReset_token_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "PasswordReset_token_key" ON public."PasswordReset" USING btree (token);


--
-- Name: PaymentGatewayConfig_priority_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "PaymentGatewayConfig_priority_idx" ON public."PaymentGatewayConfig" USING btree (priority);


--
-- Name: PaymentGatewayConfig_provider_active_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "PaymentGatewayConfig_provider_active_idx" ON public."PaymentGatewayConfig" USING btree (provider, active);


--
-- Name: PaymentTransaction_createdAt_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "PaymentTransaction_createdAt_idx" ON public."PaymentTransaction" USING btree ("createdAt");


--
-- Name: PaymentTransaction_protocol_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "PaymentTransaction_protocol_idx" ON public."PaymentTransaction" USING btree (protocol);


--
-- Name: PaymentTransaction_protocol_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "PaymentTransaction_protocol_key" ON public."PaymentTransaction" USING btree (protocol);


--
-- Name: PaymentTransaction_status_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "PaymentTransaction_status_idx" ON public."PaymentTransaction" USING btree (status);


--
-- Name: Payment_athleteId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Payment_athleteId_idx" ON public."Payment" USING btree ("athleteId");


--
-- Name: Payment_clubId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Payment_clubId_idx" ON public."Payment" USING btree ("clubId");


--
-- Name: Payment_createdAt_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Payment_createdAt_idx" ON public."Payment" USING btree ("createdAt");


--
-- Name: Payment_externalId_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "Payment_externalId_key" ON public."Payment" USING btree ("externalId");


--
-- Name: Payment_registrationId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Payment_registrationId_idx" ON public."Payment" USING btree ("registrationId");


--
-- Name: Payment_status_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Payment_status_idx" ON public."Payment" USING btree (status);


--
-- Name: ProtocolSequence_type_year_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "ProtocolSequence_type_year_key" ON public."ProtocolSequence" USING btree (type, year);


--
-- Name: Protocol_number_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "Protocol_number_key" ON public."Protocol" USING btree (number);


--
-- Name: RankingCategory_modalityId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "RankingCategory_modalityId_idx" ON public."RankingCategory" USING btree ("modalityId");


--
-- Name: RankingConfiguration_categoryId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "RankingConfiguration_categoryId_idx" ON public."RankingConfiguration" USING btree ("categoryId");


--
-- Name: RankingConfiguration_modalityId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "RankingConfiguration_modalityId_idx" ON public."RankingConfiguration" USING btree ("modalityId");


--
-- Name: RankingEntry_athleteId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "RankingEntry_athleteId_idx" ON public."RankingEntry" USING btree ("athleteId");


--
-- Name: RankingEntry_configurationId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "RankingEntry_configurationId_idx" ON public."RankingEntry" USING btree ("configurationId");


--
-- Name: RankingStageResult_athleteId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "RankingStageResult_athleteId_idx" ON public."RankingStageResult" USING btree ("athleteId");


--
-- Name: RankingStageResult_categoryId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "RankingStageResult_categoryId_idx" ON public."RankingStageResult" USING btree ("categoryId");


--
-- Name: RankingStageResult_entryId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "RankingStageResult_entryId_idx" ON public."RankingStageResult" USING btree ("entryId");


--
-- Name: RankingStageResult_modalityId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "RankingStageResult_modalityId_idx" ON public."RankingStageResult" USING btree ("modalityId");


--
-- Name: RankingStageResult_modality_category_gender_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "RankingStageResult_modality_category_gender_idx" ON public."RankingStageResult" USING btree (modality, category, gender);


--
-- Name: RankingStageResult_rankingId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "RankingStageResult_rankingId_idx" ON public."RankingStageResult" USING btree ("rankingId");


--
-- Name: RankingStageResult_season_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "RankingStageResult_season_idx" ON public."RankingStageResult" USING btree (season);


--
-- Name: Ranking_athleteId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Ranking_athleteId_idx" ON public."Ranking" USING btree ("athleteId");


--
-- Name: Ranking_athleteId_modality_category_gender_season_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "Ranking_athleteId_modality_category_gender_season_key" ON public."Ranking" USING btree ("athleteId", modality, category, gender, season);


--
-- Name: Ranking_modality_category_gender_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Ranking_modality_category_gender_idx" ON public."Ranking" USING btree (modality, category, gender);


--
-- Name: Ranking_season_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Ranking_season_idx" ON public."Ranking" USING btree (season);


--
-- Name: Registration_couponId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Registration_couponId_idx" ON public."Registration" USING btree ("couponId");


--
-- Name: Registration_eventId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Registration_eventId_idx" ON public."Registration" USING btree ("eventId");


--
-- Name: Registration_status_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Registration_status_idx" ON public."Registration" USING btree (status);


--
-- Name: Registration_userId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Registration_userId_idx" ON public."Registration" USING btree ("userId");


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: Sponsor_order_active_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "Sponsor_order_active_idx" ON public."Sponsor" USING btree ("order", active);


--
-- Name: State_countryId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "State_countryId_idx" ON public."State" USING btree ("countryId");


--
-- Name: TempRegistration_eventId_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "TempRegistration_eventId_idx" ON public."TempRegistration" USING btree ("eventId");


--
-- Name: TempRegistration_expiresAt_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "TempRegistration_expiresAt_idx" ON public."TempRegistration" USING btree ("expiresAt");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: _CategoryToNews_B_index; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX "_CategoryToNews_B_index" ON public."_CategoryToNews" USING btree ("B");


--
-- Name: event_slug_unique_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE UNIQUE INDEX event_slug_unique_idx ON public."Event" USING btree (slug) WHERE (slug IS NOT NULL);


--
-- Name: idx_athleteprofile_categoryid; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX idx_athleteprofile_categoryid ON public."AthleteProfile" USING btree ("categoryId");


--
-- Name: idx_athleteprofile_genderid; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX idx_athleteprofile_genderid ON public."AthleteProfile" USING btree ("genderId");


--
-- Name: idx_athleteprofile_modalityid; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX idx_athleteprofile_modalityid ON public."AthleteProfile" USING btree ("modalityId");


--
-- Name: idx_calendar_event_banner_timestamp; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX idx_calendar_event_banner_timestamp ON public."CalendarEvent" USING btree ("bannerTimestamp");


--
-- Name: newsimage_news_id_idx; Type: INDEX; Schema: public; Owner: fgc
--

CREATE INDEX newsimage_news_id_idx ON public.newsimage USING btree (news_id);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AthleteGallery AthleteGallery_athleteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."AthleteGallery"
    ADD CONSTRAINT "AthleteGallery_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES public."Athlete"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AthleteProfile AthleteProfile_athleteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."AthleteProfile"
    ADD CONSTRAINT "AthleteProfile_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES public."Athlete"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Athlete Athlete_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Athlete"
    ADD CONSTRAINT "Athlete_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChampionCategory ChampionCategory_modalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ChampionCategory"
    ADD CONSTRAINT "ChampionCategory_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES public."ChampionModality"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChampionEntry ChampionEntry_athleteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ChampionEntry"
    ADD CONSTRAINT "ChampionEntry_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES public."Athlete"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChampionEntry ChampionEntry_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ChampionEntry"
    ADD CONSTRAINT "ChampionEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."ChampionCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChampionEntry ChampionEntry_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ChampionEntry"
    ADD CONSTRAINT "ChampionEntry_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."ChampionshipEvent"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChampionEntry ChampionEntry_modalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ChampionEntry"
    ADD CONSTRAINT "ChampionEntry_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES public."ChampionModality"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Champion Champion_athleteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Champion"
    ADD CONSTRAINT "Champion_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES public."Athlete"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: City City_stateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."City"
    ADD CONSTRAINT "City_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES public."State"(id);


--
-- Name: Document Document_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EmailVerification EmailVerification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EmailVerification"
    ADD CONSTRAINT "EmailVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;


--
-- Name: EventCouponUsage EventCouponUsage_couponId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventCouponUsage"
    ADD CONSTRAINT "EventCouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES public."EventDiscountCoupon"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventCouponUsage EventCouponUsage_registrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventCouponUsage"
    ADD CONSTRAINT "EventCouponUsage_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES public."Registration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventDiscountCoupon EventDiscountCoupon_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventDiscountCoupon"
    ADD CONSTRAINT "EventDiscountCoupon_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."EventCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EventDiscountCoupon EventDiscountCoupon_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventDiscountCoupon"
    ADD CONSTRAINT "EventDiscountCoupon_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventDiscountCoupon EventDiscountCoupon_genderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventDiscountCoupon"
    ADD CONSTRAINT "EventDiscountCoupon_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES public."Gender"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EventDiscountCoupon EventDiscountCoupon_modalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventDiscountCoupon"
    ADD CONSTRAINT "EventDiscountCoupon_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES public."EventModality"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EventModalityToCategory EventModalityToCategory_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventModalityToCategory"
    ADD CONSTRAINT "EventModalityToCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."EventCategory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventModalityToCategory EventModalityToCategory_modalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventModalityToCategory"
    ADD CONSTRAINT "EventModalityToCategory_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES public."EventModality"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventPricingByCategory EventPricingByCategory_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventPricingByCategory"
    ADD CONSTRAINT "EventPricingByCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."EventCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EventPricingByCategory EventPricingByCategory_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventPricingByCategory"
    ADD CONSTRAINT "EventPricingByCategory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventPricingByCategory EventPricingByCategory_genderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventPricingByCategory"
    ADD CONSTRAINT "EventPricingByCategory_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES public."Gender"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EventPricingByCategory EventPricingByCategory_modalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventPricingByCategory"
    ADD CONSTRAINT "EventPricingByCategory_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES public."EventModality"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EventPricingByCategory EventPricingByCategory_tierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventPricingByCategory"
    ADD CONSTRAINT "EventPricingByCategory_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES public."EventPricingTier"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventPricingTier EventPricingTier_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventPricingTier"
    ADD CONSTRAINT "EventPricingTier_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventToCategory EventToCategory_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventToCategory"
    ADD CONSTRAINT "EventToCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."EventCategory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventToCategory EventToCategory_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventToCategory"
    ADD CONSTRAINT "EventToCategory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventToGender EventToGender_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventToGender"
    ADD CONSTRAINT "EventToGender_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventToGender EventToGender_genderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventToGender"
    ADD CONSTRAINT "EventToGender_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES public."Gender"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventToModality EventToModality_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventToModality"
    ADD CONSTRAINT "EventToModality_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventToModality EventToModality_modalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventToModality"
    ADD CONSTRAINT "EventToModality_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES public."EventModality"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventTopResult EventTopResult_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventTopResult"
    ADD CONSTRAINT "EventTopResult_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."EventCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EventTopResult EventTopResult_clubId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventTopResult"
    ADD CONSTRAINT "EventTopResult_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES public."Club"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EventTopResult EventTopResult_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventTopResult"
    ADD CONSTRAINT "EventTopResult_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EventTopResult EventTopResult_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."EventTopResult"
    ADD CONSTRAINT "EventTopResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Event Event_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."EventCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Event Event_cityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES public."City"(id);


--
-- Name: Event Event_countryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES public."Country"(id);


--
-- Name: Event Event_modalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES public."EventModality"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Event Event_organizerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Event Event_stateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES public."State"(id);


--
-- Name: AthleteStatusHistory FK_AthleteStatusHistory_Athlete; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."AthleteStatusHistory"
    ADD CONSTRAINT "FK_AthleteStatusHistory_Athlete" FOREIGN KEY ("athleteId") REFERENCES public."Athlete"(id) ON DELETE CASCADE;


--
-- Name: AthleteStatusHistory FK_AthleteStatusHistory_NewClub; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."AthleteStatusHistory"
    ADD CONSTRAINT "FK_AthleteStatusHistory_NewClub" FOREIGN KEY ("newClubId") REFERENCES public."Club"(id) ON DELETE SET NULL;


--
-- Name: AthleteStatusHistory FK_AthleteStatusHistory_Payment; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."AthleteStatusHistory"
    ADD CONSTRAINT "FK_AthleteStatusHistory_Payment" FOREIGN KEY ("paymentId") REFERENCES public."Payment"(id) ON DELETE SET NULL;


--
-- Name: AthleteStatusHistory FK_AthleteStatusHistory_PreviousClub; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."AthleteStatusHistory"
    ADD CONSTRAINT "FK_AthleteStatusHistory_PreviousClub" FOREIGN KEY ("previousClubId") REFERENCES public."Club"(id) ON DELETE SET NULL;


--
-- Name: Athlete FK_Athlete_Club; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Athlete"
    ADD CONSTRAINT "FK_Athlete_Club" FOREIGN KEY ("clubId") REFERENCES public."Club"(id) ON DELETE SET NULL;


--
-- Name: Athlete FK_Athlete_RegisteredByUser; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Athlete"
    ADD CONSTRAINT "FK_Athlete_RegisteredByUser" FOREIGN KEY ("registeredByUserId") REFERENCES public."User"(id) ON DELETE SET NULL;


--
-- Name: FooterMenu FooterMenu_footerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."FooterMenu"
    ADD CONSTRAINT "FooterMenu_footerId_fkey" FOREIGN KEY ("footerId") REFERENCES public."FooterConfig"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GalleryImage GalleryImage_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."GalleryImage"
    ADD CONSTRAINT "GalleryImage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."GalleryEvent"(id) ON DELETE CASCADE;


--
-- Name: HeaderMenu HeaderMenu_headerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."HeaderMenu"
    ADD CONSTRAINT "HeaderMenu_headerId_fkey" FOREIGN KEY ("headerId") REFERENCES public."HeaderConfig"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ModalityCategoryGender ModalityCategoryGender_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ModalityCategoryGender"
    ADD CONSTRAINT "ModalityCategoryGender_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."EventCategory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ModalityCategoryGender ModalityCategoryGender_genderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ModalityCategoryGender"
    ADD CONSTRAINT "ModalityCategoryGender_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES public."Gender"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ModalityCategoryGender ModalityCategoryGender_modalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ModalityCategoryGender"
    ADD CONSTRAINT "ModalityCategoryGender_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES public."EventModality"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ModalityToCategory ModalityToCategory_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ModalityToCategory"
    ADD CONSTRAINT "ModalityToCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."FiliationCategory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ModalityToCategory ModalityToCategory_modalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."ModalityToCategory"
    ADD CONSTRAINT "ModalityToCategory_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES public."FiliationModality"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: News News_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."News"
    ADD CONSTRAINT "News_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: NotificationAttempt NotificationAttempt_notificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."NotificationAttempt"
    ADD CONSTRAINT "NotificationAttempt_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES public."Notification"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PasswordReset PasswordReset_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."PasswordReset"
    ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;


--
-- Name: PaymentHistory PaymentHistory_transactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."PaymentHistory"
    ADD CONSTRAINT "PaymentHistory_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES public."PaymentTransaction"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PaymentTransaction PaymentTransaction_athleteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."PaymentTransaction"
    ADD CONSTRAINT "PaymentTransaction_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES public."Athlete"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PaymentTransaction PaymentTransaction_gatewayConfigId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."PaymentTransaction"
    ADD CONSTRAINT "PaymentTransaction_gatewayConfigId_fkey" FOREIGN KEY ("gatewayConfigId") REFERENCES public."PaymentGatewayConfig"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_athleteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES public."Athlete"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_clubId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES public."Club"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_registrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES public."Registration"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RankingCategory RankingCategory_modalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingCategory"
    ADD CONSTRAINT "RankingCategory_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES public."RankingModality"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RankingConfiguration RankingConfiguration_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingConfiguration"
    ADD CONSTRAINT "RankingConfiguration_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."RankingCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RankingConfiguration RankingConfiguration_modalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingConfiguration"
    ADD CONSTRAINT "RankingConfiguration_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES public."RankingModality"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RankingEntry RankingEntry_athleteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingEntry"
    ADD CONSTRAINT "RankingEntry_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES public."Athlete"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RankingEntry RankingEntry_configurationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingEntry"
    ADD CONSTRAINT "RankingEntry_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES public."RankingConfiguration"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RankingStageResult RankingStageResult_athleteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingStageResult"
    ADD CONSTRAINT "RankingStageResult_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES public."Athlete"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RankingStageResult RankingStageResult_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingStageResult"
    ADD CONSTRAINT "RankingStageResult_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."EventCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RankingStageResult RankingStageResult_modalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingStageResult"
    ADD CONSTRAINT "RankingStageResult_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES public."EventModality"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RankingStageResult RankingStageResult_rankingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."RankingStageResult"
    ADD CONSTRAINT "RankingStageResult_rankingId_fkey" FOREIGN KEY ("rankingId") REFERENCES public."Ranking"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Ranking Ranking_athleteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Ranking"
    ADD CONSTRAINT "Ranking_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES public."Athlete"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Registration Registration_couponId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES public."EventDiscountCoupon"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Registration Registration_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Registration Registration_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: State State_countryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."State"
    ADD CONSTRAINT "State_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES public."Country"(id);


--
-- Name: TempRegistration TempRegistration_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."TempRegistration"
    ADD CONSTRAINT "TempRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _CategoryToNews _CategoryToNews_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."_CategoryToNews"
    ADD CONSTRAINT "_CategoryToNews_A_fkey" FOREIGN KEY ("A") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _CategoryToNews _CategoryToNews_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."_CategoryToNews"
    ADD CONSTRAINT "_CategoryToNews_B_fkey" FOREIGN KEY ("B") REFERENCES public."News"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AthleteProfile fk_athleteprofile_category; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."AthleteProfile"
    ADD CONSTRAINT fk_athleteprofile_category FOREIGN KEY ("categoryId") REFERENCES public."EventCategory"(id) ON DELETE SET NULL;


--
-- Name: AthleteProfile fk_athleteprofile_gender; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."AthleteProfile"
    ADD CONSTRAINT fk_athleteprofile_gender FOREIGN KEY ("genderId") REFERENCES public."Gender"(id) ON DELETE SET NULL;


--
-- Name: AthleteProfile fk_athleteprofile_modality; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public."AthleteProfile"
    ADD CONSTRAINT fk_athleteprofile_modality FOREIGN KEY ("modalityId") REFERENCES public."EventModality"(id) ON DELETE SET NULL;


--
-- Name: newsimage newsimage_news_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fgc
--

ALTER TABLE ONLY public.newsimage
    ADD CONSTRAINT newsimage_news_id_fkey FOREIGN KEY (news_id) REFERENCES public."News"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: fgc
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

