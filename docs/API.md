# 📚 Documentação da API

## Endpoints Principal

### Health Check
```http
GET /health
```

Retorna o status da API.

**Resposta (200):**
```json
{
  "status": "ok"
}
```

---

## Autenticação

Todos os endpoints protegidos requerem um JWT token no header:
```
Authorization: Bearer <seu_token>
```

---

## Recursos Futuros

- [ ] Autenticação e Autorização
- [ ] CRUD de Produtos
- [ ] CRUD de Categorias
- [ ] Movimentações de Estoque
- [ ] Relatórios
- [ ] Alertas

---

**Última atualização:** 2026-06-20