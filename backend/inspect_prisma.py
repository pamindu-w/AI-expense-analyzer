import prisma
import inspect
print('prisma file:', getattr(prisma, '__file__', None))
print('dir(prisma) contains Prisma?', 'Prisma' in dir(prisma))
print('attributes:', [name for name in dir(prisma) if name[0].isupper()][:50])
print('module path:', prisma.__path__ if hasattr(prisma, '__path__') else None)
