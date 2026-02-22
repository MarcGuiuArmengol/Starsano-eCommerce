import { BlogPost, Category, Product } from "./types";

export const CATEGORIES: Category[] = [
  {
    id: "c1",
    name: "Sin Gluten",
    slug: "gluten-free",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-MQKf1Xtg4Q4wiuljZ7Q2udgX5iUPv2WKEpYhCbQcVYpKR4a2J1LWLaaY0CLHZekMy8rNmSauYJgxMn8_Nx4Tg8EkDL7bKctacoLTJXKlxSKIXO--YpftS_j5XDQ5JCTPUStCfw3p9sFZg19CByA1eRl0RNep8Vek4wuUQAr0k29SorxMPvnnI6OhUrrDsCcV642ngL6HM8gyox2Kqbfo4oZ79nWQihXqmOGUftlaoaIz8AVFmJutxpj-H38Ewpx-r6sIr8WFVfk",
  },
  {
    id: "c2",
    name: "Endulzantes naturales",
    slug: "sweeteners",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYQN8r3bSx9-TtHSlc2iKtKpASDIMlT4y7t4yrmQlyiuH92rVDZcH2qH7I5P2IpoObC5gGzeeRFTNWZxo8n99TpXQ32Btl3123FLAIHg3qSKg7tUjX-caWvW3uwTRwdg9ntWv-Xpio7e8U7p2Pb5agWNmRRMRN4nHKZC0u9E_0vG7W8KfhDOaWNFy9Y2HszX-GqEn48EuxruRflQGh7Zg4Aa0MdpZSuPTYR7x76O4xEodUgQyzT6O3gDPF4_Mb_rVYeWRNu4RGdgs",
  },
  {
    id: "c3",
    name: "Harinas saludables",
    slug: "flours",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuADiDAPoznJJHOyKn2wa2fAtD40CFI9LKS7Vk7pc_nznjQPOJj2xNzYU7oGBdwUw8BuCYZrXXUeBk_dbOl1q6TLSJyDQ02czJ6dlvnb2dWdfmJt5qg-9p9FD64jKrMb218Ldn6jYrHSc0zFaK_iSPClJrkTdhoCkcs20axQbEajKUc3xFzq_HwsZJHfTwpJ3Rnqm5hHWnDK_7A9u1G9Z4FmYY51d5G0XP7HYd_BTVLR0-LEBRFZAEfvlYPlqM5I_4UmKLJ4l0ceXfM",
  },
  {
    id: "c4",
    name: "Snacks",
    slug: "snacks",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDEJg2d59OlR6TRCDbDezU9VtP_vy0VsR2UOX_6lTiEkwfmdlwFcpYlGZ6YskFpj5q9-hVPx_2RXkPhgQHvXI9N5H_5P-PERGSVciRqtKXmBlrIzIVjPyNC27bBZPfSwTLcqIiSOBBRpGBObeRbjTGhMkLY14Xkua2Pqnm25wrxGOheExh-0xTgpCdIa4nexb_2P1OtzaUyqjVllaKGZT4TR9xH1Vpdb1AO-8_NfAJZqg2pIr5YNCgdgI5m7TibN6Qo62hJe5REalI",
  },
];

export const PRODUCTS: Product[] = [];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "b1",
    title: "5 Beneficios de la Stevia natural",
    excerpt: "Descubre por qué cambiar el azúcar refinado por Stevia puede transformar tu salud metabólica...",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC56lFh9q9EJjnaYUtvXarSOWMM-BRMAryqudEVPVxWih1y2Q9uBEz1lpCXSpmbDKoFaFLIF1_MqEl4AL2fiqxbRSDbK96jCxaqsPJWwKNogGyvOieENbmnFwy84WSyBInwOpnNHtnzoVE95V_A541cpge4-3J04LQjGfRsz2XjeYy-cRg6crWseaAtf_XdPPhGQaSNvO--7y0aMIPmrqS-E2V2AkHBEjS8R0W7Ywgxhd09QCDr5U5mDI9aJkYmwbrM6zb1wp3hiug",
    category: "Nutrición",
    slug: "beneficios-stevia"
  },
  {
    id: "b2",
    title: "Recetas rápidas con Harina de Almendras",
    excerpt: "¿Poco tiempo? Te enseñamos 3 postres saludables que puedes hacer en menos de 20 minutos...",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbDY3Vm2itOVLLs4spQE4oVqPmdaeBsm7Mo_t6K-MXyYQK9JbRHcLXn4en_8queSFSHi-CPYnnlM_iKZsLxdqmkFODwD4p_FspFmksS7lIbcDxbQAwcv3mMFQCcvROu9JtfRREGhsVWbSGC166G_xzVV6InwzudOUpHTIrfxvma6x4uMEVkRZz7nhAadh4OX7NCkujTd32je0i4tkNMxJGPoU4q4jkTAtUM_0wtF1s2txa_I3rp92QJCoNmOgpCI2_XQv5bWWXh80",
    category: "Recetas",
    slug: "recetas-almendras"
  },
  {
    id: "b3",
    title: "¿Por qué elegir productos Orgánicos?",
    excerpt: "Entender las etiquetas es fundamental para una compra consciente. Te explicamos todo sobre lo bio...",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaOeOw_rTkUkKYOFtAxGRth7K4CJo9JOGDwxCRBHGArH9Jmnwnq5nednE-EimlynoDB48lK1V5_ZlBaG4vbA9oFUSWfhPwEQ-qbve7rtiGf9muMgmkb2oz9_E_2u6kkPDkL2zuNiWrQoDSnpPtafsDe3RABhUJEotQwWF1nFeNosnkGpNEhRZLaJDGRYmmq7S7FbnFdGd-3G4caszPs3gEvCTFrslhKqV11ZEgf-XU7fll15QllK0zZLR9Dn0Vm9_N-3qWk8oACLM",
    category: "Estilo de Vida",
    slug: "elegir-organico"
  }
];
