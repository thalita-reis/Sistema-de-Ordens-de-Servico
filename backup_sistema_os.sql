--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_historico_alteracaos_acao; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_historico_alteracaos_acao AS ENUM (
    'criar',
    'atualizar',
    'deletar'
);


ALTER TYPE public.enum_historico_alteracaos_acao OWNER TO postgres;

--
-- Name: enum_orcamentos_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_orcamentos_status AS ENUM (
    'pendente',
    'aprovado',
    'rejeitado',
    'expirado'
);


ALTER TYPE public.enum_orcamentos_status OWNER TO postgres;

--
-- Name: enum_orcamentos_tanque; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_orcamentos_tanque AS ENUM (
    'vazio',
    '1/4',
    '1/2',
    '3/4',
    'cheio'
);


ALTER TYPE public.enum_orcamentos_tanque OWNER TO postgres;

--
-- Name: enum_ordem_servicos_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_ordem_servicos_status AS ENUM (
    'aberta',
    'em_andamento',
    'finalizada',
    'cancelada'
);


ALTER TYPE public.enum_ordem_servicos_status OWNER TO postgres;

--
-- Name: enum_usuarios_tipo; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_usuarios_tipo AS ENUM (
    'admin',
    'desenvolvedor',
    'usuario'
);


ALTER TYPE public.enum_usuarios_tipo OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    cpf character varying(255),
    data_inclusao timestamp with time zone,
    telefone character varying(255),
    celular character varying(255),
    fax character varying(255),
    rua character varying(255),
    numero character varying(255),
    cep character varying(255),
    bairro character varying(255),
    cidade character varying(255),
    uf character varying(2),
    email character varying(255),
    pessoa_juridica boolean DEFAULT false,
    observacoes_gerais text,
    ficha_inativa boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    complemento character varying(255)
);


ALTER TABLE public.clientes OWNER TO postgres;

--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clientes_id_seq OWNER TO postgres;

--
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- Name: dados_empresas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dados_empresas (
    id integer NOT NULL,
    razao_social character varying(255),
    nome_oficina character varying(255),
    cnpj character varying(255),
    inscricao_estadual character varying(255),
    email character varying(255),
    endereco character varying(255),
    numero character varying(255),
    bairro character varying(255),
    celular character varying(255),
    cidade character varying(255),
    estado character varying(2),
    cep character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.dados_empresas OWNER TO postgres;

--
-- Name: dados_empresas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dados_empresas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dados_empresas_id_seq OWNER TO postgres;

--
-- Name: dados_empresas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dados_empresas_id_seq OWNED BY public.dados_empresas.id;


--
-- Name: historico_alteracaos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historico_alteracaos (
    id integer NOT NULL,
    tabela character varying(255) NOT NULL,
    registro_id integer NOT NULL,
    acao public.enum_historico_alteracaos_acao NOT NULL,
    campo_alterado character varying(255),
    valor_anterior text,
    valor_novo text,
    usuario_id integer NOT NULL,
    data_alteracao timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.historico_alteracaos OWNER TO postgres;

--
-- Name: historico_alteracaos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.historico_alteracaos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historico_alteracaos_id_seq OWNER TO postgres;

--
-- Name: historico_alteracaos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historico_alteracaos_id_seq OWNED BY public.historico_alteracaos.id;


--
-- Name: orcamentos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orcamentos (
    id integer NOT NULL,
    numero character varying(255),
    cliente_id integer NOT NULL,
    data_criacao timestamp with time zone,
    data_validade timestamp with time zone,
    status public.enum_orcamentos_status DEFAULT 'pendente'::public.enum_orcamentos_status,
    valor_total numeric(10,2) DEFAULT 0,
    observacoes text,
    itens json DEFAULT '[]'::json,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    placa character varying(255),
    odometro character varying(255),
    tanque public.enum_orcamentos_tanque DEFAULT 'vazio'::public.enum_orcamentos_tanque,
    montadora character varying(255),
    veiculo character varying(255),
    combustivel character varying(255),
    ano character varying(255),
    motor character varying(255),
    modelo character varying(255),
    descricao_problema text,
    descricao_servico text,
    condicao_pagamento character varying(255),
    garantia_servico character varying(255),
    total_desconto numeric(10,2) DEFAULT 0,
    valor_final numeric(10,2) DEFAULT 0
);


ALTER TABLE public.orcamentos OWNER TO postgres;

--
-- Name: orcamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orcamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orcamentos_id_seq OWNER TO postgres;

--
-- Name: orcamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orcamentos_id_seq OWNED BY public.orcamentos.id;


--
-- Name: ordem_servicos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ordem_servicos (
    id integer NOT NULL,
    numero character varying(255),
    cliente_id integer NOT NULL,
    data_abertura timestamp with time zone,
    data_fechamento timestamp with time zone,
    status public.enum_ordem_servicos_status DEFAULT 'aberta'::public.enum_ordem_servicos_status,
    descricao_problema text,
    descricao_servico text,
    valor_total numeric(10,2) DEFAULT 0,
    observacoes text,
    tecnico_responsavel character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.ordem_servicos OWNER TO postgres;

--
-- Name: ordem_servicos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ordem_servicos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ordem_servicos_id_seq OWNER TO postgres;

--
-- Name: ordem_servicos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ordem_servicos_id_seq OWNED BY public.ordem_servicos.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    senha character varying(255) NOT NULL,
    tipo public.enum_usuarios_tipo DEFAULT 'usuario'::public.enum_usuarios_tipo,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- Name: dados_empresas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dados_empresas ALTER COLUMN id SET DEFAULT nextval('public.dados_empresas_id_seq'::regclass);


--
-- Name: historico_alteracaos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historico_alteracaos ALTER COLUMN id SET DEFAULT nextval('public.historico_alteracaos_id_seq'::regclass);


--
-- Name: orcamentos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos ALTER COLUMN id SET DEFAULT nextval('public.orcamentos_id_seq'::regclass);


--
-- Name: ordem_servicos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordem_servicos ALTER COLUMN id SET DEFAULT nextval('public.ordem_servicos_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clientes (id, nome, cpf, data_inclusao, telefone, celular, fax, rua, numero, cep, bairro, cidade, uf, email, pessoa_juridica, observacoes_gerais, ficha_inativa, created_at, updated_at, complemento) FROM stdin;
1	Thalita Pereira dos Reis 	32593604840	2025-05-22 19:47:23.729-03	11948080600	011948080600		Rua do Manifesto	2326	04209002	Ipiranga	SÃ£o Paulo	SP	thalitapereirareis@gmail.com	f	Thalita e Luciana 	f	2025-05-22 19:47:23.739-03	2025-05-22 19:47:23.739-03	\N
2	Luciana Lourdes dos Santos 	33092570880	2025-05-22 19:49:01.069-03	11985839102	11985839102		Rua do Manifesto	2326	04209002	Ipiranga	SÃ£o Paulo	SP	lucianaharry@gmail.com	f	Teste	f	2025-05-22 19:49:01.071-03	2025-05-22 19:49:01.071-03	\N
3	Mirian de Macedo 	08420013870	2025-05-22 19:52:41.873-03	11985791508	11985791508		Avenida Estilac Leal	160	07013142	Vila das Palmeiras	Guarulhos	SP	mirianmacedeo@hotmail.com	f	Miriannnnnnnnnnnnnnnnnnnnnnnnnnnn	f	2025-05-22 19:52:41.874-03	2025-05-22 19:52:41.874-03	\N
6	SANDRA R C CAMBUIm	01238997023	2025-05-23 15:50:44.66-03	11983768731			Avenida Estilac Leal	160	07013142	Vila das Palmeiras	Guarulhos	SP	sandracambuim@gmail.com	f	rrrrrrrrrrrrrrrrrrrrrrrrrrr	f	2025-05-23 15:50:44.66-03	2025-05-23 15:50:44.66-03	cass
\.


--
-- Data for Name: dados_empresas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dados_empresas (id, razao_social, nome_oficina, cnpj, inscricao_estadual, email, endereco, numero, bairro, celular, cidade, estado, cep, created_at, updated_at) FROM stdin;
1	Oficina MecÃ¢nica Macedo 	MecÃ¢nica Macedo 	43397679000107	674.438.803.079	admin@sistema.com	Rua do Manifesto,  Ipiranga - SÃ£o Paulo/SP	2326	Ipiranga	11948080600	SÃ£o Paulo	SP	04209002	2025-05-23 10:52:03.544-03	2025-05-23 13:10:26.46-03
\.


--
-- Data for Name: historico_alteracaos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historico_alteracaos (id, tabela, registro_id, acao, campo_alterado, valor_anterior, valor_novo, usuario_id, data_alteracao, created_at, updated_at) FROM stdin;
1	Cliente	1	criar	\N	\N	{"data_inclusao":"2025-05-22T22:47:23.729Z","ficha_inativa":false,"id":1,"nome":"Thalita Pereira dos Reis ","cpf":"32593604840","rg":"303070158","telefone":"11948080600","celular":"011948080600","fax":"","email":"thalitapereirareis@gmail.com","cep":"04209002","rua":"Rua do Manifesto","numero":"2326","bairro":"Ipiranga","cidade":"SÃ£o Paulo","uf":"SP","pessoa_juridica":false,"data_nascimento":"1984-07-04","observacoes_gerais":"Thalita e Luciana ","updatedAt":"2025-05-22T22:47:23.739Z","createdAt":"2025-05-22T22:47:23.739Z"}	1	2025-05-22 19:47:23.832-03	2025-05-22 19:47:23.832-03	2025-05-22 19:47:23.832-03
2	Cliente	2	criar	\N	\N	{"data_inclusao":"2025-05-22T22:49:01.069Z","ficha_inativa":false,"id":2,"nome":"Luciana Lourdes dos Santos ","cpf":"33092570880","rg":"425728341","telefone":"11985839102","celular":"11985839102","fax":"","email":"lucianaharry@gmail.com","cep":"04209002","rua":"Rua do Manifesto","numero":"2326","bairro":"Ipiranga","cidade":"SÃ£o Paulo","uf":"SP","pessoa_juridica":false,"data_nascimento":"1983-11-30","observacoes_gerais":"Teste","updatedAt":"2025-05-22T22:49:01.071Z","createdAt":"2025-05-22T22:49:01.071Z"}	1	2025-05-22 19:49:01.14-03	2025-05-22 19:49:01.141-03	2025-05-22 19:49:01.141-03
3	Cliente	3	criar	\N	\N	{"data_inclusao":"2025-05-22T22:52:41.873Z","ficha_inativa":false,"id":3,"nome":"Mirian de Macedo ","cpf":"08420013870","rg":"00000000000","telefone":"11985791508","celular":"11985791508","fax":"","email":"mirianmacedeo@hotmail.com","cep":"07013142","rua":"Avenida Estilac Leal","numero":"160","bairro":"Vila das Palmeiras","cidade":"Guarulhos","uf":"SP","pessoa_juridica":false,"data_nascimento":"1966-12-16","observacoes_gerais":"Miriannnnnnnnnnnnnnnnnnnnnnnnnnnn","updatedAt":"2025-05-22T22:52:41.874Z","createdAt":"2025-05-22T22:52:41.874Z"}	1	2025-05-22 19:52:41.946-03	2025-05-22 19:52:41.946-03	2025-05-22 19:52:41.946-03
4	Orcamento	1	criar	\N	\N	{"id":1,"numero":"000001","cliente_id":1,"data_criacao":"2025-05-22T23:31:16.092Z","data_validade":"2025-06-21T00:00:00.000Z","status":"aprovado","descricao":"teste","valor_total":"330.00","observacoes":"","itens":[{"descricao":"RemoÃ§Ã£o do tanque ","quantidade":1,"valor":180,"subtotal":180},{"descricao":"Recuperar reservatÃ³rio do Limp. de para-brisa","quantidade":1,"valor":150,"subtotal":150}],"createdAt":"2025-05-22T23:31:16.092Z","updatedAt":"2025-05-22T23:31:16.092Z","cliente":{"id":1,"nome":"Thalita Pereira dos Reis ","cpf":"32593604840","rg":"303070158","data_inclusao":"2025-05-22T22:47:23.729Z","telefone":"11948080600","celular":"011948080600","fax":"","rua":"Rua do Manifesto","numero":"2326","cep":"04209002","bairro":"Ipiranga","cidade":"SÃ£o Paulo","uf":"SP","email":"thalitapereirareis@gmail.com","pessoa_juridica":false,"data_nascimento":"1984-07-04","observacoes_gerais":"Thalita e Luciana ","ficha_inativa":false,"createdAt":"2025-05-22T22:47:23.739Z","updatedAt":"2025-05-22T22:47:23.739Z"}}	1	2025-05-22 20:31:16.17-03	2025-05-22 20:31:16.171-03	2025-05-22 20:31:16.171-03
5	Orcamento	2	criar	\N	\N	{"id":2,"numero":"000002","cliente_id":3,"data_criacao":"2025-05-22T23:44:05.015Z","data_validade":"2025-06-21T00:00:00.000Z","status":"pendente","descricao":"teste","valor_total":"565.00","observacoes":"dgdgds","itens":[{"descricao":"teste","quantidade":1,"valor":120,"subtotal":120},{"descricao":"rrrrrr","quantidade":1,"valor":445,"subtotal":445}],"createdAt":"2025-05-22T23:44:05.016Z","updatedAt":"2025-05-22T23:44:05.016Z","cliente":{"id":3,"nome":"Mirian de Macedo ","cpf":"08420013870","rg":"00000000000","data_inclusao":"2025-05-22T22:52:41.873Z","telefone":"11985791508","celular":"11985791508","fax":"","rua":"Avenida Estilac Leal","numero":"160","cep":"07013142","bairro":"Vila das Palmeiras","cidade":"Guarulhos","uf":"SP","email":"mirianmacedeo@hotmail.com","pessoa_juridica":false,"data_nascimento":"1966-12-16","observacoes_gerais":"Miriannnnnnnnnnnnnnnnnnnnnnnnnnnn","ficha_inativa":false,"createdAt":"2025-05-22T22:52:41.874Z","updatedAt":"2025-05-22T22:52:41.874Z"}}	1	2025-05-22 20:44:05.089-03	2025-05-22 20:44:05.089-03	2025-05-22 20:44:05.089-03
6	OrdemServico	1	criar	\N	\N	{"id":1,"numero":"000001","cliente_id":1,"data_abertura":"2025-05-22T23:52:15.302Z","data_fechamento":null,"status":"aberta","descricao_problema":"teste","descricao_servico":"teste","valor_total":"565.00","observacoes":"tezte","tecnico_responsavel":"Administrador","createdAt":"2025-05-22T23:52:15.302Z","updatedAt":"2025-05-22T23:52:15.302Z","cliente":{"id":1,"nome":"Thalita Pereira dos Reis ","cpf":"32593604840","rg":"303070158","data_inclusao":"2025-05-22T22:47:23.729Z","telefone":"11948080600","celular":"011948080600","fax":"","rua":"Rua do Manifesto","numero":"2326","cep":"04209002","bairro":"Ipiranga","cidade":"SÃ£o Paulo","uf":"SP","email":"thalitapereirareis@gmail.com","pessoa_juridica":false,"data_nascimento":"1984-07-04","observacoes_gerais":"Thalita e Luciana ","ficha_inativa":false,"createdAt":"2025-05-22T22:47:23.739Z","updatedAt":"2025-05-22T22:47:23.739Z"}}	1	2025-05-22 20:52:15.38-03	2025-05-22 20:52:15.38-03	2025-05-22 20:52:15.38-03
7	OrdemServico	1	atualizar	status	"aberta"	"finalizada"	1	2025-05-22 20:52:40.517-03	2025-05-22 20:52:40.517-03	2025-05-22 20:52:40.517-03
8	OrdemServico	1	atualizar	valor_total	"565.00"	565	1	2025-05-22 20:52:40.522-03	2025-05-22 20:52:40.522-03	2025-05-22 20:52:40.522-03
9	OrdemServico	1	atualizar	observacoes	"tezte"	"teste"	1	2025-05-22 20:52:40.526-03	2025-05-22 20:52:40.526-03	2025-05-22 20:52:40.526-03
10	Orcamento	2	atualizar	data_validade	"2025-06-21T00:00:00.000Z"	"2025-06-21"	1	2025-05-23 10:55:56.207-03	2025-05-23 10:55:56.208-03	2025-05-23 10:55:56.208-03
11	Orcamento	2	atualizar	placa	\N	\N	1	2025-05-23 10:55:56.217-03	2025-05-23 10:55:56.218-03	2025-05-23 10:55:56.218-03
12	Orcamento	2	atualizar	odometro	\N	\N	1	2025-05-23 10:55:56.221-03	2025-05-23 10:55:56.222-03	2025-05-23 10:55:56.222-03
13	Orcamento	2	atualizar	montadora	\N	\N	1	2025-05-23 10:55:56.226-03	2025-05-23 10:55:56.226-03	2025-05-23 10:55:56.226-03
14	Orcamento	2	atualizar	veiculo	\N	\N	1	2025-05-23 10:55:56.229-03	2025-05-23 10:55:56.229-03	2025-05-23 10:55:56.229-03
15	Orcamento	2	atualizar	combustivel	\N	\N	1	2025-05-23 10:55:56.233-03	2025-05-23 10:55:56.233-03	2025-05-23 10:55:56.233-03
16	Orcamento	2	atualizar	ano	\N	\N	1	2025-05-23 10:55:56.236-03	2025-05-23 10:55:56.236-03	2025-05-23 10:55:56.236-03
17	Orcamento	2	atualizar	motor	\N	\N	1	2025-05-23 10:55:56.24-03	2025-05-23 10:55:56.24-03	2025-05-23 10:55:56.24-03
18	Orcamento	2	atualizar	modelo	\N	\N	1	2025-05-23 10:55:56.243-03	2025-05-23 10:55:56.243-03	2025-05-23 10:55:56.243-03
19	Orcamento	2	atualizar	descricao_problema	\N	\N	1	2025-05-23 10:55:56.246-03	2025-05-23 10:55:56.246-03	2025-05-23 10:55:56.246-03
20	Orcamento	2	atualizar	descricao_servico	\N	\N	1	2025-05-23 10:55:56.249-03	2025-05-23 10:55:56.249-03	2025-05-23 10:55:56.249-03
21	Orcamento	2	atualizar	condicao_pagamento	\N	\N	1	2025-05-23 10:55:56.253-03	2025-05-23 10:55:56.253-03	2025-05-23 10:55:56.253-03
22	Orcamento	2	atualizar	garantia_servico	\N	\N	1	2025-05-23 10:55:56.257-03	2025-05-23 10:55:56.257-03	2025-05-23 10:55:56.257-03
23	Orcamento	2	atualizar	total_desconto	"0.00"	\N	1	2025-05-23 10:55:56.26-03	2025-05-23 10:55:56.26-03	2025-05-23 10:55:56.26-03
24	Orcamento	2	atualizar	valor_total	"565.00"	565	1	2025-05-23 10:55:56.262-03	2025-05-23 10:55:56.263-03	2025-05-23 10:55:56.263-03
25	Orcamento	2	atualizar	cliente	\N	{"id":3,"nome":"Mirian de Macedo ","cpf":"08420013870","data_inclusao":"2025-05-22T22:52:41.873Z","telefone":"11985791508","celular":"11985791508","fax":"","rua":"Avenida Estilac Leal","numero":"160","complemento":null,"cep":"07013142","bairro":"Vila das Palmeiras","cidade":"Guarulhos","uf":"SP","email":"mirianmacedeo@hotmail.com","pessoa_juridica":false,"observacoes_gerais":"Miriannnnnnnnnnnnnnnnnnnnnnnnnnnn","ficha_inativa":false,"createdAt":"2025-05-22T22:52:41.874Z","updatedAt":"2025-05-22T22:52:41.874Z"}	1	2025-05-23 10:55:56.266-03	2025-05-23 10:55:56.266-03	2025-05-23 10:55:56.266-03
26	Orcamento	3	criar	\N	\N	{"id":3,"numero":"000003","cliente_id":2,"data_criacao":"2025-05-23T13:59:35.338Z","data_validade":"2025-06-22T00:00:00.000Z","status":"expirado","placa":"kxu9i90","odometro":"20000","tanque":"1/4","montadora":"Fiat","veiculo":"Toro","combustivel":"Gasolina","ano":"2019","motor":"1.8","modelo":"Freedom","descricao_problema":"test","descricao_servico":"teste","condicao_pagamento":"CartÃ£o","garantia_servico":"3 Meses","total_desconto":"80.00","valor_total":"680.00","valor_final":"600.00","observacoes":"teste","itens":[{"descricao":"adasda","quantidade":1,"valor":180,"subtotal":180},{"descricao":"fsdfsfsd","quantidade":1,"valor":200,"subtotal":200},{"descricao":"teste","quantidade":1,"valor":300,"subtotal":300}],"createdAt":"2025-05-23T13:59:35.339Z","updatedAt":"2025-05-23T13:59:35.339Z","cliente":{"id":2,"nome":"Luciana Lourdes dos Santos ","cpf":"33092570880","data_inclusao":"2025-05-22T22:49:01.069Z","telefone":"11985839102","celular":"11985839102","fax":"","rua":"Rua do Manifesto","numero":"2326","complemento":null,"cep":"04209002","bairro":"Ipiranga","cidade":"SÃ£o Paulo","uf":"SP","email":"lucianaharry@gmail.com","pessoa_juridica":false,"observacoes_gerais":"Teste","ficha_inativa":false,"createdAt":"2025-05-22T22:49:01.071Z","updatedAt":"2025-05-22T22:49:01.071Z"}}	1	2025-05-23 10:59:35.419-03	2025-05-23 10:59:35.419-03	2025-05-23 10:59:35.419-03
27	Orcamento	3	atualizar	status	"expirado"	"rejeitado"	1	2025-05-23 10:59:47.878-03	2025-05-23 10:59:47.878-03	2025-05-23 10:59:47.878-03
28	Orcamento	3	atualizar	data_validade	"2025-06-22T00:00:00.000Z"	"2025-06-22"	1	2025-05-23 10:59:47.89-03	2025-05-23 10:59:47.89-03	2025-05-23 10:59:47.89-03
29	Orcamento	3	atualizar	total_desconto	"80.00"	80	1	2025-05-23 10:59:47.894-03	2025-05-23 10:59:47.894-03	2025-05-23 10:59:47.894-03
30	Orcamento	3	atualizar	valor_total	"680.00"	680	1	2025-05-23 10:59:47.898-03	2025-05-23 10:59:47.898-03	2025-05-23 10:59:47.898-03
31	Orcamento	3	atualizar	cliente	\N	{"id":2,"nome":"Luciana Lourdes dos Santos ","cpf":"33092570880","data_inclusao":"2025-05-22T22:49:01.069Z","telefone":"11985839102","celular":"11985839102","fax":"","rua":"Rua do Manifesto","numero":"2326","complemento":null,"cep":"04209002","bairro":"Ipiranga","cidade":"SÃ£o Paulo","uf":"SP","email":"lucianaharry@gmail.com","pessoa_juridica":false,"observacoes_gerais":"Teste","ficha_inativa":false,"createdAt":"2025-05-22T22:49:01.071Z","updatedAt":"2025-05-22T22:49:01.071Z"}	1	2025-05-23 10:59:47.903-03	2025-05-23 10:59:47.903-03	2025-05-23 10:59:47.903-03
32	Cliente	6	criar	\N	\N	{"data_inclusao":"2025-05-23T18:50:44.660Z","ficha_inativa":false,"id":6,"nome":"SANDRA R C CAMBUIm","cpf":"01238997023","telefone":"11983768731","celular":"","fax":"","email":"sandracambuim@gmail.com","cep":"07013142","rua":"Avenida Estilac Leal","numero":"160","complemento":"cass","bairro":"Vila das Palmeiras","cidade":"Guarulhos","uf":"SP","pessoa_juridica":false,"observacoes_gerais":"rrrrrrrrrrrrrrrrrrrrrrrrrrr","updatedAt":"2025-05-23T18:50:44.660Z","createdAt":"2025-05-23T18:50:44.660Z"}	1	2025-05-23 15:50:44.707-03	2025-05-23 15:50:44.707-03	2025-05-23 15:50:44.707-03
33	Orcamento	4	criar	\N	\N	{"id":4,"numero":"000004","cliente_id":6,"data_criacao":"2025-05-23T18:52:22.921Z","data_validade":"2025-06-22T00:00:00.000Z","status":"aprovado","placa":"xxx3i12","odometro":"20000","tanque":"3/4","montadora":"Fiat","veiculo":"Toro","combustivel":"Gasolina","ano":"2019","motor":"1.8","modelo":"Freedom","descricao_problema":"teste","descricao_servico":"teste","condicao_pagamento":"CartÃ£o","garantia_servico":"3 meses","total_desconto":"0.00","valor_total":"2000.00","valor_final":"2000.00","observacoes":"teste","itens":[{"descricao":"xxxxx","quantidade":"10","valor":180,"subtotal":1800},{"descricao":"ccccc","quantidade":1,"valor":200,"subtotal":200}],"createdAt":"2025-05-23T18:52:22.922Z","updatedAt":"2025-05-23T18:52:22.922Z","cliente":{"id":6,"nome":"SANDRA R C CAMBUIm","cpf":"01238997023","data_inclusao":"2025-05-23T18:50:44.660Z","telefone":"11983768731","celular":"","fax":"","rua":"Avenida Estilac Leal","numero":"160","complemento":"cass","cep":"07013142","bairro":"Vila das Palmeiras","cidade":"Guarulhos","uf":"SP","email":"sandracambuim@gmail.com","pessoa_juridica":false,"observacoes_gerais":"rrrrrrrrrrrrrrrrrrrrrrrrrrr","ficha_inativa":false,"createdAt":"2025-05-23T18:50:44.660Z","updatedAt":"2025-05-23T18:50:44.660Z"}}	1	2025-05-23 15:52:22.968-03	2025-05-23 15:52:22.968-03	2025-05-23 15:52:22.968-03
\.


--
-- Data for Name: orcamentos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orcamentos (id, numero, cliente_id, data_criacao, data_validade, status, valor_total, observacoes, itens, created_at, updated_at, placa, odometro, tanque, montadora, veiculo, combustivel, ano, motor, modelo, descricao_problema, descricao_servico, condicao_pagamento, garantia_servico, total_desconto, valor_final) FROM stdin;
1	000001	1	2025-05-22 20:31:16.092-03	2025-06-20 21:00:00-03	aprovado	330.00		[{"descricao":"RemoÃ§Ã£o do tanque ","quantidade":1,"valor":180,"subtotal":180},{"descricao":"Recuperar reservatÃ³rio do Limp. de para-brisa","quantidade":1,"valor":150,"subtotal":150}]	2025-05-22 20:31:16.092-03	2025-05-22 20:31:16.092-03	\N	\N	vazio	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00
2	000002	3	2025-05-22 20:44:05.015-03	2025-06-20 21:00:00-03	pendente	565.00	dgdgds	[{"descricao":"teste","quantidade":1,"valor":120,"subtotal":120},{"descricao":"rrrrrr","quantidade":1,"valor":445,"subtotal":445}]	2025-05-22 20:44:05.016-03	2025-05-23 10:55:56.199-03			vazio											0.00	565.00
3	000003	2	2025-05-23 10:59:35.338-03	2025-06-21 21:00:00-03	rejeitado	680.00	teste	[{"descricao":"adasda","quantidade":1,"valor":180,"subtotal":180},{"descricao":"fsdfsfsd","quantidade":1,"valor":200,"subtotal":200},{"descricao":"teste","quantidade":1,"valor":300,"subtotal":300}]	2025-05-23 10:59:35.339-03	2025-05-23 10:59:47.872-03	kxu9i90	20000	1/4	Fiat	Toro	Gasolina	2019	1.8	Freedom	test	teste	CartÃ£o	3 Meses	80.00	600.00
4	000004	6	2025-05-23 15:52:22.921-03	2025-06-21 21:00:00-03	aprovado	2000.00	teste	[{"descricao":"xxxxx","quantidade":"10","valor":180,"subtotal":1800},{"descricao":"ccccc","quantidade":1,"valor":200,"subtotal":200}]	2025-05-23 15:52:22.922-03	2025-05-23 15:52:22.922-03	xxx3i12	20000	3/4	Fiat	Toro	Gasolina	2019	1.8	Freedom	teste	teste	CartÃ£o	3 meses	0.00	2000.00
\.


--
-- Data for Name: ordem_servicos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ordem_servicos (id, numero, cliente_id, data_abertura, data_fechamento, status, descricao_problema, descricao_servico, valor_total, observacoes, tecnico_responsavel, created_at, updated_at) FROM stdin;
1	000001	1	2025-05-22 20:52:15.302-03	\N	finalizada	teste	teste	565.00	teste	Administrador	2025-05-22 20:52:15.302-03	2025-05-22 20:52:40.51-03
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nome, email, senha, tipo, ativo, created_at, updated_at) FROM stdin;
1	Administrador	admin@sistema.com	$2a$10$EVEzbK.OsMm08C0jkSl/vO1OyUj9NBTw2KQtfLHeIT9x3qWyXBnN2	admin	t	2025-05-22 17:26:34.047-03	2025-05-22 17:26:34.047-03
2	Administrador	admin@oficinmacedo.com	$2a$10$Kqujci/CYrzXCA.gmSJq8u3GzRo0IVlSxSBM9/SBHJUlLdjub9T/6	admin	t	2025-05-29 13:09:38.504-03	2025-05-29 13:09:38.504-03
3	Thalita Reis	thalita.reis@oficinmacedo.com	$2a$10$lUEyF2VJNjwQepbfNp7s9OVQ2HVSKOFA45J4AnTYi/92aGcMZmm2.	admin	t	2025-05-29 14:39:36.755-03	2025-05-29 14:39:36.755-03
\.


--
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clientes_id_seq', 6, true);


--
-- Name: dados_empresas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dados_empresas_id_seq', 1, true);


--
-- Name: historico_alteracaos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historico_alteracaos_id_seq', 33, true);


--
-- Name: orcamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orcamentos_id_seq', 4, true);


--
-- Name: ordem_servicos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ordem_servicos_id_seq', 1, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 3, true);


--
-- Name: clientes clientes_cpf_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key1 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key10 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key11 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key12 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key13 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key14 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key15 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key16 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key17 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key18 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key19 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key2 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key20 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key21 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key22 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key23 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key24 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key25 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key26 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key27 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key28 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key29 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key3 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key30 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key31 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key32 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key33 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key34 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key35 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key4 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key5 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key6 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key7 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key8 UNIQUE (cpf);


--
-- Name: clientes clientes_cpf_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cpf_key9 UNIQUE (cpf);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: dados_empresas dados_empresas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dados_empresas
    ADD CONSTRAINT dados_empresas_pkey PRIMARY KEY (id);


--
-- Name: historico_alteracaos historico_alteracaos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historico_alteracaos
    ADD CONSTRAINT historico_alteracaos_pkey PRIMARY KEY (id);


--
-- Name: orcamentos orcamentos_numero_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key1 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key10 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key11 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key12 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key13 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key14 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key15 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key16 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key17 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key18 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key19 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key2 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key20 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key21 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key22 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key23 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key24 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key25 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key26 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key27 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key28 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key29 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key3 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key30 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key31 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key32 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key33 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key34 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key35 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key4 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key5 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key6 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key7 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key8 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_numero_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_numero_key9 UNIQUE (numero);


--
-- Name: orcamentos orcamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_pkey PRIMARY KEY (id);


--
-- Name: ordem_servicos ordem_servicos_numero_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordem_servicos
    ADD CONSTRAINT ordem_servicos_numero_key UNIQUE (numero);


--
-- Name: ordem_servicos ordem_servicos_numero_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordem_servicos
    ADD CONSTRAINT ordem_servicos_numero_key1 UNIQUE (numero);


--
-- Name: ordem_servicos ordem_servicos_numero_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordem_servicos
    ADD CONSTRAINT ordem_servicos_numero_key2 UNIQUE (numero);


--
-- Name: ordem_servicos ordem_servicos_numero_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordem_servicos
    ADD CONSTRAINT ordem_servicos_numero_key3 UNIQUE (numero);


--
-- Name: ordem_servicos ordem_servicos_numero_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordem_servicos
    ADD CONSTRAINT ordem_servicos_numero_key4 UNIQUE (numero);


--
-- Name: ordem_servicos ordem_servicos_numero_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordem_servicos
    ADD CONSTRAINT ordem_servicos_numero_key5 UNIQUE (numero);


--
-- Name: ordem_servicos ordem_servicos_numero_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordem_servicos
    ADD CONSTRAINT ordem_servicos_numero_key6 UNIQUE (numero);


--
-- Name: ordem_servicos ordem_servicos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordem_servicos
    ADD CONSTRAINT ordem_servicos_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_email_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key1 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key10 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key11 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key12 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key13 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key14 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key15 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key16 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key17 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key18 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key19 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key2 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key20 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key21 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key22 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key23 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key24 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key25 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key26 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key27 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key28 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key29 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key3 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key30 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key31 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key32 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key33 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key34 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key35 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key36 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key37 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key4 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key5 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key6 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key7 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key8 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key9 UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: historico_alteracaos historico_alteracaos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historico_alteracaos
    ADD CONSTRAINT historico_alteracaos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orcamentos orcamentos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ordem_servicos ordem_servicos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordem_servicos
    ADD CONSTRAINT ordem_servicos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE;


--
-- PostgreSQL database dump complete
--

