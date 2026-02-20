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

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Mantequilla de Almendras",
    price: 8.50,
    description: "100% natural, sin aditivos. Perfecta para untar o añadir a tus batidos proteicos.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQH8efSf55dRiSihq8QOyOxTxKNVoAmGN4wJ-6M7Ps4nz5VP8DrckXIExBcTl34p9Mw37BHcE2KXFTrXRwU81XiQXuSGVas6wZSZ3IXTEnLDRWEmitCcLGtrzj39x0dkxBt39BuKlcOse3GehAfdeONvv708sZOUt37Up48pkZYQ-SfGixM3NRbzfoI2jkacVu-RrjvCqKLbbGGFNmDkAxxnOn7Ox_XPZBf1vnsFVWURVT5sAlnHx2rd0OaMM_CMPy3UpwQVCewPs",
    category: "snacks",
    badges: ["Organic", "Keto"],
    rating: 4.8
  },
  {
    id: "p2",
    name: "Quinoa Real Blanca",
    price: 4.95,
    description: "Altamente nutritiva, 500g. Fuente excelente de proteína vegetal y fibra.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFWhbhncBfTLJV1f4psa9yICQJDsj872swMKsNk5krFc1y1fWUQT29-Dj3jp8BoWvGobA9JhsozevG0HbK-7k9Gb_bhO4ZnmrnxB0c1MLezWO_NrEVYRLj57muWTDhP-uzvnEGRtlCx4rAK_IFIEKLZQ2NCdteJ62eVyPlz2EgSJCbCYC9IMCwwCzOns-8S0cxNLjHCZsymrICy2fxwl2aOemNxsgXdrltJuELgZViXHw1gYmjfBNKEg9L8wlgmLRz51bRFflvUGM",
    category: "gluten-free",
    badges: ["Organic", "Gluten Free"],
    rating: 4.5
  },
  {
    id: "p3",
    name: "Granola Crunchy Sin Azúcar",
    price: 6.20,
    description: "Mix de avena y nueces horneado lentamente para obtener el crujido perfecto sin azúcar añadido.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAepgR8kq9BVR6YalmFWYPrgQNBlx7ArVYtZuOmt1GZiE6NKM8WthQgcVLywKtNTQ5WsvF75Nop-AGxlN4HLEdSNaxYigRMTvC75SrlqIEyQUBxExsZsrTRXA6Wj41Zx1AwipV0qrb_2meHRP3XyqovQz75drSJ4eXTNvX-AswDuDw6u8TzzzWW7DRxnrzfyLH2TiZZYB8mZEjspdS-Dan_SrVo59aK7rw6n0r_XkajXVlhuJTnLr2zq4lXIaBFKQ93N5s9OZFaVUQ",
    category: "snacks",
    badges: ["Sugar Free"],
    rating: 4.9
  },
  {
    id: "p4",
    name: "Harina de Almendras Fina",
    price: 12.90,
    description: "Ideal para repostería Keto. Molienda extra fina para macarons y bizcochos esponjosos.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbfUwLr7m8wxoMLTtLrwbBw9kAICddplwb7aJmtqoq6TeLwv4bvB-fby4jKxTZ6v9Q2z83xvVe7vIt5-E3KRozsJf1GK0dZW3pvhv2ESoFqZSfhoenOJl4LWZwmCZ5sLnHBQ-mvCrxsML8yIQ-J-KzP5paDgUBSNhBYekUmkV4ngw7PfdUtn4HbLAii8asQ61OT1TrmeviNXQLOO4gUgZyqJTMDvfvbeXtnYi8DpnCQRW-FKTKKuX9zIiYjopaBU_XKuZwBjwuuoA",
    category: "flours",
    badges: ["Keto", "Gluten Free"],
    rating: 4.7
  },
  {
    id: "p5",
    name: "Aceite de Coco Virgen",
    price: 9.50,
    description: "Prensado en frío, 500ml. Ideal para cocinar a altas temperaturas o cuidado personal.",
    image: "https://picsum.photos/id/102/800/800",
    category: "sweeteners",
    badges: ["Organic", "Keto"],
    rating: 4.6
  },
  {
    id: "p6",
    name: "Pasta de Lentejas Rojas",
    price: 3.80,
    description: "Rica en proteínas y fibra. Una alternativa saludable a la pasta tradicional.",
    image: "https://picsum.photos/id/292/800/800",
    category: "gluten-free",
    badges: ["Gluten Free", "High Protein"],
    rating: 4.4
  }
];

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
