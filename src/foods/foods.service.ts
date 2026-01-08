import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CalculateNutritionDto, CreateFoodDto, FoodFilterDto, UpdateFoodDto } from './dto/food.dto';

@Injectable()
export class FoodsService {
  constructor(private prisma: PrismaService) {}

  // Mapa de palavras-chave relacionadas para sugestões inteligentes
  private readonly relatedKeywords: Record<string, string[]> = {
    // Refeições e ocasiões
    'churrasco': ['picanha', 'carne', 'linguiça', 'costela', 'fraldinha', 'maminha', 'alcatra', 'cupim', 'coração de frango', 'farofa', 'vinagrete', 'pão de alho', 'queijo coalho'],
    'cafe da manha': ['pão', 'leite', 'café', 'ovo', 'queijo', 'presunto', 'manteiga', 'iogurte', 'granola', 'aveia', 'banana', 'mamão', 'tapioca', 'cuscuz'],
    'almoco': ['arroz', 'feijão', 'carne', 'frango', 'salada', 'legumes', 'macarrão', 'batata', 'farofa'],
    'jantar': ['sopa', 'salada', 'omelete', 'sanduíche', 'frango', 'peixe', 'legumes'],
    'lanche': ['pão', 'biscoito', 'fruta', 'iogurte', 'barra de cereal', 'sanduíche', 'suco'],
    'sobremesa': ['pudim', 'sorvete', 'bolo', 'mousse', 'brigadeiro', 'doce de leite', 'gelatina', 'fruta'],
    'festa': ['salgadinho', 'coxinha', 'empadinha', 'quibe', 'bolo', 'brigadeiro', 'refrigerante', 'suco'],
    
    // Dietas e estilos
    'fitness': ['frango', 'ovo', 'batata doce', 'arroz integral', 'brócolis', 'whey', 'aveia', 'banana', 'atum'],
    'dieta': ['salada', 'frango grelhado', 'peixe', 'legumes', 'ovo', 'iogurte natural', 'frutas'],
    'vegano': ['tofu', 'grão de bico', 'lentilha', 'quinoa', 'cogumelo', 'soja', 'leite de amêndoas', 'leite de coco'],
    'vegetariano': ['ovo', 'queijo', 'tofu', 'grão de bico', 'lentilha', 'cogumelo', 'legumes'],
    'low carb': ['ovo', 'queijo', 'carne', 'frango', 'peixe', 'abacate', 'castanha', 'brócolis', 'couve-flor'],
    'proteina': ['frango', 'carne', 'ovo', 'peixe', 'whey', 'queijo', 'iogurte', 'atum', 'salmão'],
    
    // Categorias gerais
    'carne': ['bovina', 'frango', 'porco', 'peixe', 'patinho', 'alcatra', 'filé mignon', 'costela', 'acém'],
    'fruta': ['banana', 'maçã', 'laranja', 'mamão', 'manga', 'abacaxi', 'morango', 'uva', 'melancia'],
    'verdura': ['alface', 'couve', 'espinafre', 'rúcula', 'agrião', 'brócolis', 'repolho'],
    'legume': ['cenoura', 'batata', 'abobrinha', 'berinjela', 'chuchu', 'beterraba', 'abóbora'],
    'bebida': ['água', 'suco', 'refrigerante', 'café', 'chá', 'leite', 'cerveja', 'vinho'],
    'doce': ['chocolate', 'bolo', 'brigadeiro', 'pudim', 'sorvete', 'biscoito', 'açúcar'],
    'salgado': ['coxinha', 'pastel', 'empada', 'quibe', 'esfiha', 'pão de queijo'],
    
    // Preparações
    'frito': ['batata frita', 'ovo frito', 'pastel', 'coxinha', 'frango frito'],
    'grelhado': ['frango grelhado', 'carne grelhada', 'peixe grelhado', 'legumes grelhados'],
    'assado': ['frango assado', 'carne assada', 'batata assada', 'pernil'],
    'cozido': ['ovo cozido', 'legumes cozidos', 'frango cozido', 'feijão'],
    
    // Suplementos
    'suplemento': ['whey', 'creatina', 'bcaa', 'glutamina', 'albumina', 'caseína', 'pré-treino'],
    'pre treino': ['cafeína', 'beta alanina', 'citrulina', 'creatina'],
    'pos treino': ['whey', 'dextrose', 'maltodextrina', 'bcaa'],
    'ganho de massa': ['whey', 'hipercalórico', 'creatina', 'albumina'],
  };

  // Sinônimos para normalização de busca
  private readonly synonyms: Record<string, string[]> = {
    'batata doce': ['batata-doce', 'batata salsa'],
    'pao': ['pão'],
    'cafe': ['café'],
    'acucar': ['açúcar'],
    'maca': ['maçã'],
    'feijao': ['feijão'],
    'frango': ['galinha', 'peito de frango'],
    'carne': ['boi', 'bovina', 'gado'],
    'porco': ['suíno', 'suína'],
    'leite': ['lácteo'],
  };

  // Normaliza texto removendo acentos
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // Calcula score de relevância para ordenação inteligente
  private calculateRelevanceScore(description: string, query: string): number {
    const descNorm = this.normalizeText(description);
    const queryNorm = this.normalizeText(query);
    
    // Score máximo: match exato
    if (descNorm === queryNorm) return 10000;
    
    // Começa exatamente com a query seguido de vírgula ou espaço
    if (descNorm.startsWith(queryNorm + ',')) return 9000; // "Maçã, fuji" quando busca "maçã"
    if (descNorm.startsWith(queryNorm + ' ')) return 8500;
    if (descNorm.startsWith(queryNorm)) return 8000;
    
    // Palavra exata no início (antes da vírgula)
    const firstPart = descNorm.split(',')[0].trim();
    if (firstPart === queryNorm) return 7500;
    if (firstPart.startsWith(queryNorm + ' ')) return 7000;
    if (firstPart.startsWith(queryNorm)) return 6500;
    
    // Palavra exata em qualquer posição
    const words = descNorm.split(/[\s,]+/);
    if (words.includes(queryNorm)) return 5000;
    
    // Começa com a query em alguma palavra
    if (words.some(w => w.startsWith(queryNorm))) return 4000;
    
    // Contém a query como substring
    const idx = descNorm.indexOf(queryNorm);
    if (idx !== -1) {
      // Quanto mais no início, maior o score
      return 3000 - Math.min(idx * 10, 2000);
    }
    
    return 100;
  }

  // Calcula score para múltiplas palavras
  private calculateRelevanceScoreMultiWord(description: string, queryWords: string[]): number {
    if (queryWords.length === 1) {
      return this.calculateRelevanceScore(description, queryWords[0]);
    }
    
    const descNorm = this.normalizeText(description);
    const descWords = descNorm.split(/[\s,]+/);
    
    let totalScore = 0;
    let allWordsFound = true;
    
    for (const queryWord of queryWords) {
      const wordNorm = this.normalizeText(queryWord);
      
      // Verifica se a palavra está presente
      const exactMatch = descWords.includes(wordNorm);
      const startsWithMatch = descWords.some(w => w.startsWith(wordNorm));
      const containsMatch = descNorm.includes(wordNorm);
      
      if (!containsMatch) {
        allWordsFound = false;
        break;
      }
      
      // Score por palavra
      if (exactMatch) {
        totalScore += 1000;
        // Bonus se é a primeira palavra da descrição
        if (descWords[0] === wordNorm) totalScore += 500;
      } else if (startsWithMatch) {
        totalScore += 500;
      } else {
        totalScore += 200;
      }
    }
    
    if (!allWordsFound) return 0;
    
    // Bonus por descrição mais curta (mais específica)
    totalScore += Math.max(0, 500 - description.length * 2);
    
    // Bonus se as palavras aparecem na ordem da busca
    const queryJoined = queryWords.map(w => this.normalizeText(w)).join('.*');
    if (new RegExp(queryJoined).test(descNorm)) {
      totalScore += 300;
    }
    
    return totalScore;
  }

  // Busca palavras-chave relacionadas para sugestões
  private getRelatedKeywords(query: string): string[] {
    const queryNorm = this.normalizeText(query);
    const related: Set<string> = new Set();
    
    // Busca direta no mapa de relacionados
    for (const [key, values] of Object.entries(this.relatedKeywords)) {
      const keyNorm = this.normalizeText(key);
      if (keyNorm === queryNorm || keyNorm.includes(queryNorm) || queryNorm.includes(keyNorm)) {
        values.forEach(v => related.add(v));
      }
    }
    
    // Busca reversa: se a query está nos valores, adiciona outros valores do mesmo grupo
    for (const [key, values] of Object.entries(this.relatedKeywords)) {
      const valuesNorm = values.map(v => this.normalizeText(v));
      if (valuesNorm.some(v => v.includes(queryNorm) || queryNorm.includes(v))) {
        values.forEach(v => related.add(v));
        related.add(key); // Adiciona a própria categoria
      }
    }
    
    // Remove a própria query dos relacionados
    related.delete(query);
    related.delete(queryNorm);
    
    return Array.from(related).slice(0, 10); // Limita a 10 sugestões
  }

  // Busca alimentos relacionados quando não há resultados
  private async findRelatedFoods(query: string, limit: number = 10): Promise<any[]> {
    const relatedKeywords = this.getRelatedKeywords(query);
    
    if (relatedKeywords.length === 0) {
      return [];
    }
    
    // Busca alimentos que contenham alguma das palavras relacionadas
    const orConditions = relatedKeywords.flatMap(keyword => [
      { description: { contains: keyword } },
      { description: { contains: this.normalizeText(keyword) } },
    ]);
    
    const relatedFoods = await this.prisma.food.findMany({
      where: {
        deletedAt: null,
        OR: orConditions,
      },
      take: limit * 3, // Busca mais para poder ordenar
      select: {
        id: true,
        description: true,
        groupName: true,
        sourceTable: true,
        portionGrams: true,
        nutrients: {
          select: {
            valuePer100g: true,
            nutrient: {
              select: {
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    });
    
    // Ordena por relevância às palavras-chave relacionadas
    const scored = relatedFoods.map(food => {
      let score = 0;
      const descNorm = this.normalizeText(food.description);
      
      for (const keyword of relatedKeywords) {
        const keyNorm = this.normalizeText(keyword);
        if (descNorm.startsWith(keyNorm)) score += 100;
        else if (descNorm.includes(keyNorm)) score += 50;
      }
      
      // Bonus para fontes oficiais
      if (food.sourceTable === 'TACO') score += 20;
      if (food.sourceTable === 'SUPLEMENTOS') score += 15;
      
      return { ...food, score };
    });
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...food }) => food);
  }

  async findAll(filters: FoodFilterDto): Promise<PaginatedResponseDto<any>> {
    const { page = 1, size = 20 } = filters;

    const where: any = { deletedAt: null };

    // Busca inteligente: suporta múltiplas palavras
    if (filters.q) {
      const words = filters.q.trim().split(/\s+/).filter(w => w.length > 0);
      
      if (words.length === 1) {
        // Busca simples: uma palavra
        const queryNorm = this.normalizeText(words[0]);
        where.OR = [
          { description: { contains: filters.q } },
          { description: { contains: queryNorm } },
        ];
      } else {
        // Busca com múltiplas palavras: todas devem estar presentes
        where.AND = words.map(word => {
          const wordNorm = this.normalizeText(word);
          return {
            OR: [
              { description: { contains: word } },
              { description: { contains: wordNorm } },
            ],
          };
        });
      }
    }
    if (filters.group) {
      where.groupName = filters.group;
    }
    if (filters.source) {
      where.sourceTable = filters.source;
    }

    // Se tem query, buscar mais resultados para ordenar por relevância
    const fetchSize = filters.q ? Math.min(1000, size * 20) : size;

    const [allData, total] = await Promise.all([
      this.prisma.food.findMany({
        where,
        take: fetchSize,
        select: {
          id: true,
          description: true,
          groupName: true,
          sourceTable: true,
          portionGrams: true,
          createdAt: true,
          updatedAt: true,
          nutrients: {
            select: {
              valuePer100g: true,
              nutrient: {
                select: {
                  name: true,
                  unit: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.food.count({ where }),
    ]);

    let sortedData = allData;

    // Se tem query, ordenar por relevância
    if (filters.q) {
      const words = filters.q.trim().split(/\s+/).filter(w => w.length > 0);
      
      sortedData = allData
        .map(food => ({
          ...food,
          relevance: this.calculateRelevanceScoreMultiWord(food.description, words) +
            // Bonus significativo para fontes oficiais
            (food.sourceTable === 'TACO' ? 200 : 0) +
            (food.sourceTable === 'SUPLEMENTOS' ? 150 : 0),
        }))
        .sort((a, b) => b.relevance - a.relevance)
        .map(({ relevance, ...food }) => food);
    }

    // Aplicar paginação após ordenação
    const skip = (page - 1) * size;
    const paginatedData = sortedData.slice(skip, skip + size);

    // Buscar sugestões relacionadas se poucos ou nenhum resultado
    let suggestions: any[] = [];
    let relatedKeywords: string[] = [];
    
    if (filters.q && total < 5) {
      relatedKeywords = this.getRelatedKeywords(filters.q);
      const relatedFoods = await this.findRelatedFoods(filters.q, 10);
      
      suggestions = relatedFoods.map(f => {
        const getNutrient = (name: string) => {
          const fn = (f as any).nutrients?.find((n: any) => n.nutrient.name === name);
          return fn ? Number(fn.valuePer100g) : 0;
        };
        
        return {
          id: f.id,
          description: f.description,
          groupName: f.groupName,
          sourceTable: f.sourceTable,
          portionGrams: Number(f.portionGrams),
          kcal: getNutrient('Energia'),
          protein: getNutrient('Proteína'),
          carbs: getNutrient('Carboidrato total'),
          fat: getNutrient('Lipídeos'),
          fiber: getNutrient('Fibra alimentar'),
        };
      });
    }

    const formatFood = (f: any) => {
      const getNutrient = (name: string) => {
        const fn = f.nutrients?.find((n: any) => n.nutrient.name === name);
        return fn ? Number(fn.valuePer100g) : 0;
      };
      
      return {
        id: f.id,
        description: f.description,
        groupName: f.groupName,
        sourceTable: f.sourceTable,
        portionGrams: Number(f.portionGrams),
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        kcal: getNutrient('Energia'),
        protein: getNutrient('Proteína'),
        carbs: getNutrient('Carboidrato total'),
        fat: getNutrient('Lipídeos'),
        fiber: getNutrient('Fibra alimentar'),
      };
    };

    const response: any = {
      data: paginatedData.map(formatFood),
      meta: {
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      },
    };

    // Adiciona sugestões se houver
    if (suggestions.length > 0) {
      response.suggestions = {
        message: total === 0 
          ? `Não encontramos "${filters.q}", mas você pode gostar de:`
          : `Veja também alimentos relacionados:`,
        keywords: relatedKeywords,
        foods: suggestions,
      };
    }

    return response;
  }

  async findOne(id: number) {
    const food = await this.prisma.food.findFirst({
      where: { id, deletedAt: null },
      include: {
        nutrients: {
          include: { nutrient: true },
        },
        measures: true,
      },
    });

    if (!food) {
      throw new NotFoundException(`Alimento com ID ${id} não encontrado`);
    }

    return {
      id: food.id,
      description: food.description,
      groupName: food.groupName,
      sourceTable: food.sourceTable,
      portionGrams: Number(food.portionGrams),
      createdAt: food.createdAt,
      updatedAt: food.updatedAt,
      nutrients: food.nutrients.map(fn => ({
        id: fn.nutrient.id,
        name: fn.nutrient.name,
        unit: fn.nutrient.unit,
        valuePer100g: Number(fn.valuePer100g),
      })),
      measures: food.measures.map(m => ({
        id: m.id,
        measureDescription: m.measureDescription,
        grams: Number(m.grams),
      })),
    };
  }

  async create(dto: CreateFoodDto) {
    const food = await this.prisma.food.create({
      data: {
        description: dto.description,
        groupName: dto.groupName,
        sourceTable: dto.sourceTable,
        portionGrams: dto.portionGrams,
      },
    });

    return { ...food, portionGrams: Number(food.portionGrams) };
  }

  async update(id: number, dto: UpdateFoodDto) {
    await this.findOne(id);

    const food = await this.prisma.food.update({
      where: { id },
      data: dto,
    });

    return { ...food, portionGrams: Number(food.portionGrams) };
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.food.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Alimento excluído com sucesso' };
  }

  async calculateNutrition(id: number, dto: CalculateNutritionDto) {
    const food = await this.findOne(id);
    const factor = dto.amount_grams / 100;

    return {
      foodId: food.id,
      foodDescription: food.description,
      amountGrams: dto.amount_grams,
      nutrients: food.nutrients.map(n => ({
        name: n.name,
        unit: n.unit,
        calculatedValue: Math.round(n.valuePer100g * factor * 100) / 100,
      })),
    };
  }
}
