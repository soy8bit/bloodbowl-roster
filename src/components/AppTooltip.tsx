import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip'

interface AppTooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export default function AppTooltip({ content, children, side = 'top' }: AppTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>
        {content}
      </TooltipContent>
    </Tooltip>
  )
}
