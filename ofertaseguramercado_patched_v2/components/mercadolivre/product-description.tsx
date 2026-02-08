"use client"

import Image from "next/image"
import { ChevronRight } from "lucide-react"

export function ProductDescription() {
  return (
    <div className="bg-white mt-2">
      {/* Product features */}
      <div className="px-4 py-3 border-b border-[#E6E6E6]">
        <h2 className="text-base font-medium text-[#333] mb-3">
          Características principais
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#666]">Formato de venda</span>
            <span className="text-[#333]">Kit</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#666]">Whey Protein</span>
            <span className="text-[#333]">900g</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#666]">Creatina</span>
            <span className="text-[#333]">300g</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#666]">Restrições</span>
            <span className="text-[#333]">Sem glúten</span>
          </div>
        </div>
        <button className="flex items-center gap-1 text-sm text-[#3483FA] mt-3">
          Ver todas as características
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Nutritional Table */}
      <div className="px-4 py-3 border-b border-[#E6E6E6]">
        <h2 className="text-base font-medium text-[#333] mb-3">
          Tabela Nutricional - 100% Whey (porção 30g)
        </h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[#FAFAFA]">
              <tr>
                <th className="text-left px-2 py-1.5 font-medium text-[#333] border-b">
                  Informação
                </th>
                <th className="text-right px-2 py-1.5 font-medium text-[#333] border-b">
                  30g
                </th>
                <th className="text-right px-2 py-1.5 font-medium text-[#333] border-b">
                  %VD*
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-2 py-1.5 text-[#333]">Valor energético</td>
                <td className="px-2 py-1.5 text-right text-[#333]">126 kcal</td>
                <td className="px-2 py-1.5 text-right text-[#666]">6%</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1.5 text-[#333]">Carboidratos</td>
                <td className="px-2 py-1.5 text-right text-[#333]">5,8g</td>
                <td className="px-2 py-1.5 text-right text-[#666]">2%</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1.5 text-[#333]">Açúcares totais</td>
                <td className="px-2 py-1.5 text-right text-[#333]">5,1g</td>
                <td className="px-2 py-1.5 text-right text-[#666]">-</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1.5 text-[#333]">Açúcares adicionados</td>
                <td className="px-2 py-1.5 text-right text-[#333]">0,2g</td>
                <td className="px-2 py-1.5 text-right text-[#666]">0%</td>
              </tr>
              <tr className="border-b bg-[#F5F5F5]">
                <td className="px-2 py-1.5 text-[#333] font-medium">Proteínas</td>
                <td className="px-2 py-1.5 text-right text-[#333] font-medium">21g</td>
                <td className="px-2 py-1.5 text-right text-[#666] font-medium">42%</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1.5 text-[#333]">Gorduras totais</td>
                <td className="px-2 py-1.5 text-right text-[#333]">2,1g</td>
                <td className="px-2 py-1.5 text-right text-[#666]">3%</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1.5 text-[#333]">Gorduras saturadas</td>
                <td className="px-2 py-1.5 text-right text-[#333]">1,2g</td>
                <td className="px-2 py-1.5 text-right text-[#666]">6%</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 text-[#333]">Sódio</td>
                <td className="px-2 py-1.5 text-right text-[#333]">62mg</td>
                <td className="px-2 py-1.5 text-right text-[#666]">3%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-[#999] mt-2">
          *Percentual de valores diários fornecidos pela porção.
        </p>
      </div>

      {/* Amino acids table */}
      <div className="px-4 py-3 border-b border-[#E6E6E6]">
        <h2 className="text-base font-medium text-[#333] mb-3">
          Aminoácidos por porção (30g)
        </h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <tbody>
              <tr className="border-b">
                <td className="px-2 py-1.5 text-[#333]">Leucina</td>
                <td className="px-2 py-1.5 text-right text-[#333]">2.181mg</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1.5 text-[#333]">Isoleucina</td>
                <td className="px-2 py-1.5 text-right text-[#333]">1.256mg</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1.5 text-[#333]">Valina</td>
                <td className="px-2 py-1.5 text-right text-[#333]">1.232mg</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1.5 text-[#333]">Ácido Glutâmico</td>
                <td className="px-2 py-1.5 text-right text-[#333]">3.580mg</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1.5 text-[#333]">Ácido Aspártico</td>
                <td className="px-2 py-1.5 text-right text-[#333]">2.252mg</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1.5 text-[#333]">Lisina</td>
                <td className="px-2 py-1.5 text-right text-[#333]">1.894mg</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1.5 text-[#333]">Treonina</td>
                <td className="px-2 py-1.5 text-right text-[#333]">1.452mg</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1.5 text-[#333]">Prolina</td>
                <td className="px-2 py-1.5 text-right text-[#333]">1.217mg</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1.5 text-[#333]">Serina</td>
                <td className="px-2 py-1.5 text-right text-[#333]">1.095mg</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 text-[#333]">Alanina</td>
                <td className="px-2 py-1.5 text-right text-[#333]">1.019mg</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-[#999] mt-2">
          Não contém quantidades significativas de gorduras trans e fibras alimentares.
        </p>
      </div>

      {/* Nutritional Table Image */}
      <div className="px-4 py-3 border-b border-[#E6E6E6]">
        <h2 className="text-base font-medium text-[#333] mb-3">
          Tabela Nutricional Completa
        </h2>
        <div className="relative w-full">
          <Image
            src="/images/tabela-nutricional.png"
            alt="Tabela Nutricional Completa 100% Whey"
            width={400}
            height={600}
            className="w-full h-auto rounded-lg border border-[#E6E6E6]"
          />
        </div>
      </div>

      {/* Description */}
      <div className="px-4 py-3">
        <h2 className="text-base font-medium text-[#333] mb-3">
          Descrição
        </h2>
        <div className="text-sm text-[#666] space-y-3">
          <p className="leading-relaxed">
            Kit completo para quem busca ganho de massa muscular e performance. Inclui 100% Whey Protein 900g + Creatina 300g da Max Titanium, marcas consagradas no mercado de suplementos.
          </p>
          
          <div>
            <h3 className="text-sm font-medium text-[#333] mb-1">100% Whey Protein 900g</h3>
            <ul className="list-disc list-inside space-y-0.5">
              <li>21g de proteína por porção (30g)</li>
              <li>Alto teor de BCAAs e aminoácidos essenciais</li>
              <li>Rápida absorção</li>
              <li>Sem glúten</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[#333] mb-1">Creatina 300g</h3>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Creatina monohidratada pura</li>
              <li>Auxilia no aumento de força</li>
              <li>Melhora o desempenho em exercícios de alta intensidade</li>
              <li>100 doses por embalagem</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[#333] mb-1">Modo de uso</h3>
            <p className="leading-relaxed">
              <strong>Whey:</strong> Adicionar 30g (2 dosadores) em 200ml de água ou leite. Consumir após o treino.
            </p>
            <p className="leading-relaxed">
              <strong>Creatina:</strong> Adicionar 3g (1 dosador) em 200ml de água. Consumir diariamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
