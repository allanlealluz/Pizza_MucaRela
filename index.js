import express from "express";
import { engine } from 'express-handlebars'; 
import path from "path";
import bodyParser from 'body-parser';
import fetch from 'node-fetch'; 

const app = express();
const port = 3000;

app.engine('handlebars', engine({
    defaultLayout: 'main',
    partialsDir: path.resolve('views/partials'),
    helpers: {
        eq: (a, b) => a === b,
        json: (context) => JSON.stringify(context),
        currency: (value) => parseFloat(value).toFixed(2).replace('.', ',')
    }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.resolve('public')));
app.set('view engine', 'handlebars');
app.set('views', path.resolve('views'));

const bebidas = [
    { id: 1, nome: 'Coca-Cola 350ml', preco: 4.50, categoria: 'Refrigerante' },
    { id: 2, nome: 'Coca-Cola 600ml', preco: 6.50, categoria: 'Refrigerante' },
    { id: 3, nome: 'Guaraná Antarctica 350ml', preco: 4.00, categoria: 'Refrigerante' },
    { id: 4, nome: 'Guaraná Antarctica 600ml', preco: 6.00, categoria: 'Refrigerante' },
    { id: 5, nome: 'Fanta Laranja 350ml', preco: 4.00, categoria: 'Refrigerante' },
    { id: 6, nome: 'Sprite 350ml', preco: 4.00, categoria: 'Refrigerante' },
    { id: 7, nome: 'Água Mineral 500ml', preco: 2.50, categoria: 'Água' },
    { id: 8, nome: 'Água com Gás 500ml', preco: 3.00, categoria: 'Água' },
    { id: 9, nome: 'Suco de Laranja 300ml', preco: 5.50, categoria: 'Suco Natural' },
    { id: 10, nome: 'Suco de Uva 300ml', preco: 5.50, categoria: 'Suco Natural' },
    { id: 11, nome: 'Cerveja Skol Lata 350ml', preco: 3.50, categoria: 'Cerveja' },
    { id: 12, nome: 'Cerveja Brahma Lata 350ml', preco: 3.50, categoria: 'Cerveja' },
    { id: 13, nome: 'Cerveja Heineken Lata 350ml', preco: 5.00, categoria: 'Cerveja' }
];

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/cardapio", (req, res) => {
    res.render("cardapio");
});

app.get("/bebidas", (req, res) => {
    const bebidasPorCategoria = bebidas.reduce((acc, bebida) => {
        if (!acc[bebida.categoria]) {
            acc[bebida.categoria] = [];
        }
        acc[bebida.categoria].push(bebida);
        return acc;
    }, {});
    res.render("bebidas", { 
        bebidasPorCategoria,
        bebidas
    });
});

app.get("/entrega", (req, res) => {
    res.render("entrega");
});

// API para buscar endereço pelo CEP
app.get("/api/endereco/:cep", async (req, res) => {
    const cep = req.params.cep.replace(/\D/g, '');
    
    if (cep.length !== 8) {
        return res.status(400).json({ error: 'CEP inválido' });
    }
    
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
            return res.status(404).json({ error: 'CEP não encontrado' });
        }
        
        // Calcular taxa de entrega baseado no bairro/localidade
        const taxaEntrega = calcularTaxaEntrega(data);
        
        res.json({
            ...data,
            taxaEntrega
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar CEP' });
    }
});

// Função para calcular taxa de entrega
function calcularTaxaEntrega(endereco) {
    // Defina aqui os bairros e suas taxas
    const taxasPorBairro = {
        // Bairros mais próximos - taxa menor
        'Centro': 5.00,
        'Vila Nova': 6.00,
        'Jardim das Flores': 7.00,
        
        // Bairros intermediários
        'Bela Vista': 8.00,
        'Santa Maria': 9.00,
        
        // Bairros mais distantes
        'São João': 12.00,
        'Vila Esperança': 15.00
    };
    
    // Verifica se o bairro está na lista
    const bairro = endereco.bairro;
    if (taxasPorBairro[bairro]) {
        return taxasPorBairro[bairro].toFixed(2);
    }
    
    // Taxa padrão para bairros não listados
    return '10.00';
}

// Helper para garantir que um valor seja sempre um array
const ensureArray = (value) => (Array.isArray(value) ? value : [value].filter(Boolean));

// Rota para finalizar pedido com entrega
app.post("/finalizar-pedido", (req, res) => {
    const {
        // Dados da pizza
        sabores = [],
        tamanho,
        borda,
        adicionais = [],
        totalPizza,
        
        // Dados das bebidas
        bebidas: bebidasSelecionadas = [],
        quantidades = [],
        totalBebidas,
        
        // Dados de entrega
        tipoEntrega,
        nome,
        telefone,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        taxaEntrega,
        
        // Totais
        totalGeral
    } = req.body;
    
    // Processar arrays usando o helper ensureArray
    const saboresArray = ensureArray(sabores);
    const adicionaisArray = ensureArray(adicionais);
    const bebidasArray = ensureArray(bebidasSelecionadas);
    const quantidadesArray = ensureArray(quantidades);
    
    // Processar bebidas
    const bebidasPedido = bebidasArray.map((bebidaId, index) => {
        const bebida = bebidas.find(b => b.id === parseInt(bebidaId));
        if (!bebida) return null;
        const quantidade = parseInt(quantidadesArray[index]) || 1;
        return {
            ...bebida,
            quantidade,
            subtotal: (bebida.preco * quantidade).toFixed(2)
        };
    }).filter(Boolean);
    
    // Montar dados de entrega
    const dadosEntrega = tipoEntrega === 'entrega' ? {
        nome,
        telefone,
        endereco: {
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            estado
        },
        taxaEntrega: parseFloat(taxaEntrega).toFixed(2)
    } : null;
    
    const timestamp = Date.now();
    
    res.render("pedido-completo", {
        // Timestamp do pedido
        timestamp,
        
        // Dados da pizza
        sabores: saboresArray,
        tamanho: tamanho || 'Não selecionado',
        borda: borda || 'Sem Borda',
        adicionais: adicionaisArray,
        totalPizza: totalPizza || '0.00',
        
        // Dados das bebidas
        bebidas: bebidasPedido,
        totalBebidas: totalBebidas || '0.00',
        
        // Dados de entrega
        tipoEntrega,
        dadosEntrega,
        
        // Total geral
        totalGeral: totalGeral || '0.00'
    });
});


app.post("/pedido", (req, res) => {
    const { sabores = [], tamanho, borda, adicionais = [], total } = req.body;
    const saboresArray = ensureArray(sabores);
    const adicionaisArray = ensureArray(adicionais);
    res.render("pedido", {
        sabores: saboresArray,
        tamanho: tamanho || 'Não selecionado',
        borda: borda || 'Sem Borda',
        adicionais: adicionaisArray,
        total: total || '0.00'
    });
});

app.listen(port, () => {
    console.log(`🚀 Pizzaria MucaRoela rodando em http://localhost:${port}`);
});

