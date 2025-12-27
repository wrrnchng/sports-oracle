"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNews, type NewsEnabledSport } from "@/hooks/use-news"
import { Loader2, Newspaper, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface NewsSidebarProps {
    sport: NewsEnabledSport
    limit?: number
}

export function NewsSidebar({ sport, limit = 5 }: NewsSidebarProps) {
    const { data, isLoading, error } = useNews({ sport, limit })

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Newspaper className="size-5" />
                        Latest News
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error || !data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Newspaper className="size-5" />
                        Latest News
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Unable to load news at this time
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Newspaper className="size-5" />
                    Latest News
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.articles.map((article) => (
                        <a
                            key={article.id}
                            href={article.links.web.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group"
                        >
                            <div className="space-y-2">
                                {article.images && article.images[0] && (
                                    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                                        <img
                                            src={article.images[0].url}
                                            alt={article.headline}
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                                        />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                        {article.headline}
                                    </h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                        {article.description}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(article.published), { addSuffix: true })}
                                        </span>
                                        <ExternalLink className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
