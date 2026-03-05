interface AutomationCardProps {
  title: string
  description: string
  tools: string[]
}

export default function AutomationCard({ title, description, tools }: AutomationCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col">
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-5">{description}</p>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => (
          <span
            key={tool}
            className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full"
          >
            {tool}
          </span>
        ))}
      </div>
    </div>
  )
}
