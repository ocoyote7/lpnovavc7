"use client"

import { Star, ThumbsUp, CheckCircle } from "lucide-react"

const reviews = [
  {
    id: 1,
    name: "Carlos M.",
    avatar: "C",
    rating: 5,
    date: "Há 3 dias",
    title: "Excelente produto!",
    comment: "Produto de qualidade, chegou antes do prazo. Dissolve muito bem e o sabor é ótimo. Recomendo!",
    verified: true,
    likes: 42,
    location: "São Paulo, SP"
  },
  {
    id: 2,
    name: "Amanda S.",
    avatar: "A",
    rating: 5,
    date: "Há 1 semana",
    title: "Superou expectativas",
    comment: "Já é a terceira vez que compro. Qualidade top, sabor muito bom e rende bastante. Entrega super rápida!",
    verified: true,
    likes: 38,
    location: "Rio de Janeiro, RJ"
  },
  {
    id: 3,
    name: "Ricardo L.",
    avatar: "R",
    rating: 5,
    date: "Há 2 semanas",
    title: "Melhor custo-benefício",
    comment: "Ótimo whey pelo preço. Uso há 6 meses e já tive resultados visíveis. Embalagem chegou perfeita.",
    verified: true,
    likes: 56,
    location: "Belo Horizonte, MG"
  },
  {
    id: 4,
    name: "Fernanda P.",
    avatar: "F",
    rating: 5,
    date: "Há 2 semanas",
    title: "Muito satisfeita!",
    comment: "Produto original, lacrado e dentro da validade. Sabor morango é muito gostoso, não enjoa. Voltarei a comprar!",
    verified: true,
    likes: 29,
    location: "Curitiba, PR"
  },
  {
    id: 5,
    name: "Bruno T.",
    avatar: "B",
    rating: 4,
    date: "Há 3 semanas",
    title: "Bom produto",
    comment: "Bom whey, bom preço. Dissolve bem na água ou no leite. Entrega foi rápida, chegou em 2 dias.",
    verified: true,
    likes: 18,
    location: "Porto Alegre, RS"
  }
]

export function CustomerReviews() {
  return (
    <div className="bg-white px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[#333]">
          Opiniões do produto
        </h2>
        <span className="text-sm text-[#3483FA]">Ver todas</span>
      </div>

      {/* Rating Summary */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[#E6E6E6]">
        <div className="text-center">
          <div className="text-3xl font-bold text-[#333]">4.8</div>
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= 4 ? "fill-[#3483FA] text-[#3483FA]" : "fill-[#3483FA] text-[#3483FA]"}`}
              />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm text-[#666]">
            <span className="font-medium text-[#333]">2.847</span> avaliações
          </p>
          <p className="text-xs text-[#00A650] mt-0.5">
            98% recomendam este produto
          </p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="pb-4 border-b border-[#E6E6E6] last:border-0 last:pb-0">
            {/* User info */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#3483FA] flex items-center justify-center text-white text-sm font-medium">
                {review.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-[#333]">{review.name}</span>
                  {review.verified && (
                    <CheckCircle className="w-3.5 h-3.5 text-[#00A650]" />
                  )}
                </div>
                <p className="text-xs text-[#999]">{review.location}</p>
              </div>
              <span className="text-xs text-[#999]">{review.date}</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= review.rating
                      ? "fill-[#3483FA] text-[#3483FA]"
                      : "fill-[#E6E6E6] text-[#E6E6E6]"
                  }`}
                />
              ))}
            </div>

            {/* Comment */}
            <h3 className="text-sm font-medium text-[#333] mb-1">{review.title}</h3>
            <p className="text-sm text-[#666] leading-relaxed">{review.comment}</p>

            {/* Likes */}
            <div className="flex items-center gap-1.5 mt-2">
              <button className="flex items-center gap-1 text-xs text-[#666] hover:text-[#3483FA]">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{review.likes} pessoas acharam útil</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button className="w-full mt-4 py-2.5 border border-[#3483FA] text-[#3483FA] text-sm font-medium rounded-md">
        Ver todas as avaliações
      </button>
    </div>
  )
}
