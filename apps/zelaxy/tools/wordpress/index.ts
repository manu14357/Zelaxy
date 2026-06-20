import { createPostTool } from '@/tools/wordpress/create_post'
import { getPostTool } from '@/tools/wordpress/get_post'
import { listPostsTool } from '@/tools/wordpress/list_posts'
import { updatePostTool } from '@/tools/wordpress/update_post'

export const wordpressCreatePostTool = createPostTool
export const wordpressListPostsTool = listPostsTool
export const wordpressGetPostTool = getPostTool
export const wordpressUpdatePostTool = updatePostTool
