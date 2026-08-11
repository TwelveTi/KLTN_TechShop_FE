import { Icon } from '../../../shared/components/Icon'
import type { ProductDetailData } from '../types'

export interface ProductSpecsTableProps {
  product: ProductDetailData
}

export function ProductSpecsTable({ product }: ProductSpecsTableProps) {
  // Group specifications by group title
  const groupedSpecs = (product.specifications || []).reduce<Record<string, Array<{ name: string; value: string }>>>(
    (acc, spec) => {
      const groupName = spec.group || 'Technical Specifications'
      if (!acc[groupName]) acc[groupName] = []
      acc[groupName].push({ name: spec.name, value: spec.value })
      return acc
    },
    {}
  )

  const groupKeys = Object.keys(groupedSpecs)

  return (
    <div className="ts-pdp-specs-section">
      {/* Overview / Detailed Description */}
      <div className="ts-pdp-specs-block">
        <h2 className="ts-pdp-specs-block__title">Product Overview</h2>
        <div className="ts-pdp-specs-block__desc">
          <p>{product.fullDescription || product.shortDescription}</p>
        </div>

        {/* Highlights List */}
        {product.highlights && product.highlights.length > 0 && (
          <div className="ts-pdp-highlights">
            <h3 className="ts-pdp-highlights__title">Hardware Highlights</h3>
            <ul className="ts-pdp-highlights__list">
              {product.highlights.map((highlight, idx) => (
                <li key={idx} className="ts-pdp-highlights__item">
                  <Icon name="shield-check" size={16} className="ts-pdp-highlights__icon" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Specifications Table */}
      <div className="ts-pdp-specs-block">
        <h2 className="ts-pdp-specs-block__title">Technical Specifications</h2>

        {groupKeys.length === 0 ? (
          <p className="text-muted">Standard hardware configuration.</p>
        ) : (
          <div className="ts-pdp-spec-groups">
            {groupKeys.map((group) => (
              <div key={group} className="ts-pdp-spec-group">
                <h3 className="ts-pdp-spec-group__title">{group}</h3>
                <table className="ts-pdp-spec-table">
                  <tbody>
                    {groupedSpecs[group].map((row, idx) => (
                      <tr key={idx} className="ts-pdp-spec-table__row">
                        <th scope="row" className="ts-pdp-spec-table__name">
                          {row.name}
                        </th>
                        <td className="ts-pdp-spec-table__value tabular-nums">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
